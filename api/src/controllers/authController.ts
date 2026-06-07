import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { registerSchema, loginSchema, profileSchema } from '../utils/validation';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/http';
import { JWT_SECRET } from '../config/jwt';
import { extractPermissions, USER_WITH_ROLES_INCLUDE } from '../services/UserService';

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
    await prisma.userRole.create({
      data: { userId: user.id, roleId: readerRole.id },
    });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

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

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, permissions },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

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

export const getMe = catchAsync(async (req: any, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
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

export const getPublicProfile = catchAsync(async (req: any, res: Response) => {
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

export const updateMe = catchAsync(async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

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
