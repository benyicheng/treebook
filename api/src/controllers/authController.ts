import crypto from 'crypto';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { registerSchema, loginSchema, profileSchema } from '../utils/validation';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/http';
import { getCurrentUser } from '../utils/authHelpers';
import { type AuthRequest } from '../middleware/auth';
import { JWT_SECRET, JwtPayload } from '../config/jwt';
import { extractPermissions, USER_WITH_ROLES_INCLUDE } from '../services/UserService';

// --- Constants ---
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const REFRESH_TOKEN_BYTES = 40;
const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/auth';

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
    path: REFRESH_COOKIE_PATH,
  });
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}

// --- Helpers ---

/**
 * Generate a cryptographically random refresh token, store its SHA-256 hash
 * in the database, and return the raw (plaintext) token to the client.
 *
 * The raw token is sent to the client and never stored — only the hash
 * is persisted, so a DB leak cannot be used to forge refresh tokens.
 */
async function generateRefreshToken(userId: string): Promise<string> {
  const raw = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
    },
  });

  return raw;
}

/**
 * Verify and consume (rotate) a refresh token.
 * - Looks up the token hash in the DB
 * - Checks it is not revoked or expired
 * - Revokes the old token (one-time use / rotation)
 * - Returns the owning user id so callers never have to trust an unsigned JWT.
 *
 * The user identity is sourced solely from the DB record — the refresh token's
 * hash is the trust root. We do NOT rely on jwt.decode() of the access token,
 * because that path is not signature-verified and could be forged.
 */
async function rotateRefreshToken(rawToken: string): Promise<{ userId: string }> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token not found');
  }
  if (stored.revokedAt) {
    throw new AppError(401, 'REFRESH_TOKEN_REVOKED', 'Refresh token has been revoked');
  }
  if (stored.expiresAt < new Date()) {
    throw new AppError(401, 'REFRESH_TOKEN_EXPIRED', 'Refresh token has expired');
  }

  // Revoke old token (rotation)
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return { userId: stored.userId };
}

/** Issue a short-lived JWT access token */
function issueAccessToken(user: { id: string; email: string; role: string }, permissions?: string[]) {
  const payload: Record<string, any> = { id: user.id, email: user.email, role: user.role };
  if (permissions) payload.permissions = permissions;
  return jwt.sign(payload, JWT_SECRET(), { expiresIn: ACCESS_TOKEN_EXPIRY });
}

// --- Endpoints ---

export const register = catchAsync(async (req: Request, res: Response) => {
  const { email, username, password } = registerSchema.parse(req.body);

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    throw new AppError(400, 'CONFLICT', 'User already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      role: 'reader',
    },
  });

  // Assign default 'reader' RBAC role to new user
  const readerRole = await prisma.role.findUnique({ where: { name: 'reader' } });
  if (readerRole) {
    await prisma.userRoleAssignment.create({
      data: { userId: user.id, roleId: readerRole.id },
    });
  }

  const token = issueAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);
  setRefreshCookie(res, refreshToken);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token,
    }
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email },
    include: USER_WITH_ROLES_INCLUDE,
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid credentials');
  }

  const permissions = extractPermissions(user.roles);
  const token = issueAccessToken(user, permissions);
  const refreshToken = await generateRefreshToken(user.id);
  setRefreshCookie(res, refreshToken);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        roles: user.roles.map(r => r.role.name),
        permissions
      },
      token,
    }
  });
});

// --- Refresh & Logout ---

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const rawToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
  if (!rawToken || typeof rawToken !== 'string') {
    res.status(204).end();
    return;
  }

  // The refresh token's DB record is the trust root for user identity here.
  // Rotating it validates validity (not revoked / not expired) AND returns the
  // owning userId. We deliberately do NOT use jwt.decode() to derive identity,
  // since an unsigned decode cannot be trusted and would allow forging identity.
  const { userId } = await rotateRefreshToken(rawToken);

  // Defense-in-depth: if a (signature-verified) access token is still present
  // and still valid, require it to belong to the same user as the refresh token.
  // An expired/absent access token is acceptable (that's the normal refresh path).
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET()) as JwtPayload;
      if (decoded.id !== userId) {
        throw new AppError(401, 'REFRESH_TOKEN_MISMATCH', 'Refresh token does not match user');
      }
    } catch (err) {
      // Re-throw the explicit mismatch above; any other verify error (expired,
      // malformed) is fine for a refresh flow — swallow it.
      if (err instanceof AppError) throw err;
    }
  }

  // Fetch current user data for fresh JWT claims
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: USER_WITH_ROLES_INCLUDE,
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }

  const permissions = extractPermissions(user.roles);
  const newAccessToken = issueAccessToken(user, permissions);
  const newRefreshToken = await generateRefreshToken(user.id);
  setRefreshCookie(res, newRefreshToken);

  res.json({
    success: true,
    data: {
      token: newAccessToken,
      refreshToken: newRefreshToken,
    }
  });
});

export const logout = catchAsync(async (req: AuthRequest, res: Response) => {
  const { refreshToken: rawToken } = req.body;
  const { id: userId } = getCurrentUser(req);

  if (rawToken && typeof rawToken === 'string') {
    // Revoke the specific refresh token
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    await prisma.refreshToken.updateMany({
      where: { tokenHash, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } else {
    // No token provided → revoke ALL refresh tokens for this user
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  clearRefreshCookie(res);
  res.json({ success: true, data: null });
});

export const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id } = getCurrentUser(req);
  const user = await prisma.user.findUnique({
    where: { id },
    include: USER_WITH_ROLES_INCLUDE,
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }

  const permissions = extractPermissions(user.roles);

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl,
      followerCount: user.followerCount,
      followingCount: user.followingCount,
      roles: user.roles.map(r => r.role.name),
      permissions
    }
  });
});

export const getPublicProfile = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      role: true,
      followerCount: true,
      followingCount: true,
      createdAt: true,
    },
  });

  if (!user) throw new AppError(404, 'NOT_FOUND', '用户不存在');

  // Get story and branch counts
  const storyCount = await prisma.story.count({ where: { authorId: userId } });
  const branchCount = await prisma.branch.count({ where: { authorId: userId } });
  const spinoffCount = await prisma.spinoff.count({ where: { authorId: userId } });

  res.json({
    success: true,
    data: {
      ...user,
      storyCount,
      branchCount,
      spinoffCount,
    },
  });
});

export const updateMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const { username, avatarUrl, profile } = req.body || {};

  if (username) {
    const existing = await prisma.user.findFirst({
      where: { username, NOT: { id: userId } },
      select: { id: true },
    });
    if (existing) {
      throw new AppError(409, 'CONFLICT', 'Username already exists');
    }
  }

  // Validate profile structure (S1.8)
  const validatedProfile = profileSchema.parse(profile);

  await prisma.user.update({
    where: { id: userId },
    data: {
      username: username ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
      profile: validatedProfile ? JSON.stringify(validatedProfile) : undefined,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: USER_WITH_ROLES_INCLUDE,
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }

  const permissions = extractPermissions(user.roles);

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl,
      roles: user.roles.map(r => r.role.name),
      permissions
    }
  });
});
