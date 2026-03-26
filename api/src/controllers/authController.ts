import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const register = async (req: Request, res: Response) => {
  const { email, username, password, role } = req.body;

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Conflict', message: 'User already exists' });
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
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
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
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid credentials' });
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
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role, // Keep for backward compatibility
        roles: user.roles.map(r => r.role.name),
        permissions
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Login failed' });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
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
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    const permissions = Array.from(new Set(
      user.roles.flatMap(ur => 
        ur.role.permissions.map(rp => rp.permission.code)
      )
    ));

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl,
      roles: user.roles.map(r => r.role.name),
      permissions
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to fetch user info' });
  }
};

export const updateMe = async (req: any, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { username, avatarUrl, profile } = req.body || {};

  try {
    if (username) {
      const existing = await prisma.user.findFirst({
        where: { username, NOT: { id: userId } },
        select: { id: true },
      });
      if (existing) {
        return res.status(409).json({ error: 'Conflict', message: 'Username already exists' });
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
      return res.status(404).json({ error: 'Not Found', message: 'User not found' });
    }

    const permissions = Array.from(new Set(
      user.roles.flatMap((ur: any) =>
        ur.role.permissions.map((rp: any) => rp.permission.code)
      )
    ));

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl,
      roles: user.roles.map((r: any) => r.role.name),
      permissions
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to update profile' });
  }
};
