import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/http';
import { prisma } from '../prisma';
import { parsePagination } from '../utils/pagination';

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const { sortBy, search } = req.query;
  const { page, limit } = parsePagination(req.query);
  const take = limit;
  const skip = (page - 1) * take;

  const where: any = {};
  if (search && typeof search === 'string') {
    where.OR = [
      { username: { contains: search } },
      { email: { contains: search } },
    ];
  }

  let orderBy: any = [{ createdAt: 'desc' as const }];
  if (sortBy === 'popular') {
    orderBy = [{ followerCount: 'desc' as const }, { createdAt: 'desc' as const }];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        role: true,
        profile: true,
        followerCount: true,
        followingCount: true,
        createdAt: true,
        roles: {
          select: {
            roleId: true,
            role: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy,
      take,
      skip,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      items: users,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  });
});

export const assignRole = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { roleId } = req.body;

  const [user, role] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.role.findUnique({ where: { id: roleId } }),
  ]);

  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');
  if (!role) throw new AppError(404, 'NOT_FOUND', 'Role not found');

  const existing = await prisma.userRoleAssignment.findUnique({
    where: { userId_roleId: { userId, roleId } },
  });
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'User already has this role');
  }

  await prisma.userRoleAssignment.create({ data: { userId, roleId } });

  res.json({ success: true, data: { message: 'Role assigned to user' } });
});

export const removeRole = catchAsync(async (req: Request, res: Response) => {
  const { userId, roleId } = req.params;

  const userRole = await prisma.userRoleAssignment.findUnique({
    where: { userId_roleId: { userId, roleId } },
  });
  if (!userRole) {
    throw new AppError(404, 'NOT_FOUND', 'User does not have this role');
  }

  await prisma.userRoleAssignment.delete({
    where: { userId_roleId: { userId, roleId } },
  });

  res.json({ success: true, data: { message: 'Role removed from user' } });
});
