import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { registerSchema, loginSchema } from '../utils/validation';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/http';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = catchAsync(async (req: Request, res: Response) => {
  const { email, username, password, role } = registerSchema.parse(req.body);

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existingUser) {
    throw new AppError(400, 'CONFLICT', 'User already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      role: role || 'reader',
    },
  });

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
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid credentials');
  }

  // Flatten permissions
  const permissions = Array.from(new Set(
    user.roles.flatMap(ur => 
      ur.role.permissions.map(rp => rp.permission.code)
    )
  ));

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
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }

  const permissions = Array.from(new Set(
    user.roles.flatMap(ur => 
      ur.role.permissions.map(rp => rp.permission.code)
    )
  ));

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

  await prisma.user.update({
    where: { id: userId },
    data: {
      username: username ?? undefined,
      avatarUrl: avatarUrl ?? undefined,
      profile: profile ? JSON.stringify(profile) : undefined,
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }

  const permissions = Array.from(new Set(
    user.roles.flatMap((ur: any) =>
      ur.role.permissions.map((rp: any) => rp.permission.code)
    )
  ));

  res.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl,
      roles: user.roles.map((r: any) => r.role.name),
      permissions
    }
  });
});
