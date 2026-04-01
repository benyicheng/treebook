import { prisma } from '../prisma';
import { AppError } from '../utils/http';

export class RoleService {
  private static permissionsCache: { data: any[] | null; expiresAt: number } = { data: null, expiresAt: 0 };

  static async listRoles(query: { page?: number; pageSize?: number; q?: string }) {
    const page = Math.max(Number(query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(query.pageSize) || 20, 1), 100);
    const q = query.q?.trim() || '';

    const where = q
      ? {
          OR: [
            { name: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : undefined;

    const [total, items] = await Promise.all([
      prisma.role.count({ where }),
      prisma.role.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          description: true,
          _count: { select: { users: true, permissions: true } },
        },
      }),
    ]);

    return { items, total, page, pageSize };
  }

  static async createRole(data: { name: string; description?: string; permissionIds?: string[] }) {
    const { name, description, permissionIds } = data;
    
    if (!name?.trim()) {
      throw new AppError(400, 'VALIDATION_ERROR', 'name is required');
    }

    const pids = Array.from(new Set(permissionIds || []));
    if (pids.length > 0) {
      const permissionCount = await prisma.permission.count({ where: { id: { in: pids } } });
      if (permissionCount !== pids.length) {
        throw new AppError(400, 'VALIDATION_ERROR', 'permissionIds contains invalid id');
      }
    }

    try {
      return await prisma.role.create({
        data: {
          name: name.trim(),
          description,
          permissions: {
            create: pids.map((pid) => ({
              permissionId: pid
            }))
          }
        },
        select: { id: true, name: true, description: true }
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new AppError(409, 'ROLE_NAME_CONFLICT', 'Role name already exists');
      }
      throw e;
    }
  }

  static async getRoleById(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });

    if (!role) throw new AppError(404, 'NOT_FOUND', 'Role not found');
    return role;
  }

  static async updateRole(id: string, data: { name?: string; description?: string }) {
    const { name, description } = data;
    
    if (name !== undefined && !name.trim()) {
      throw new AppError(400, 'VALIDATION_ERROR', 'name is invalid');
    }

    try {
      return await prisma.role.update({
        where: { id },
        data: {
          name: name?.trim(),
          description,
        },
        select: { id: true, name: true, description: true },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new AppError(409, 'ROLE_NAME_CONFLICT', 'Role name already exists');
      }
      throw e;
    }
  }

  static async updateRolePermissions(id: string, permissionIds: string[]) {
    const pids = Array.from(new Set(permissionIds || []));
    
    if (pids.length > 0) {
      const permissionCount = await prisma.permission.count({ where: { id: { in: pids } } });
      if (permissionCount !== pids.length) {
        throw new AppError(400, 'VALIDATION_ERROR', 'permissionIds contains invalid id');
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      if (pids.length > 0) {
        await tx.rolePermission.createMany({
          data: pids.map((pid) => ({
            roleId: id,
            permissionId: pid
          })),
        });
      }
    });
    
    return { success: true, message: 'Permissions updated' };
  }

  static async listPermissions(q?: string) {
    const query = q?.trim() || '';
    const now = Date.now();

    if (!query && this.permissionsCache.data && this.permissionsCache.expiresAt > now) {
      return this.permissionsCache.data;
    }

    const permissions = await prisma.permission.findMany({
      where: query
        ? {
            OR: [
              { code: { contains: query } },
              { description: { contains: query } },
            ],
          }
        : undefined,
      orderBy: { code: 'asc' },
    });

    if (!query) {
      this.permissionsCache.data = permissions;
      this.permissionsCache.expiresAt = now + 60_000;
    }

    return permissions;
  }

  static async deleteRole(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      select: { id: true, _count: { select: { users: true } } },
    });

    if (!role) throw new AppError(404, 'NOT_FOUND', 'Role not found');
    if (role._count.users > 0) {
      throw new AppError(409, 'ROLE_IN_USE', 'Role has users assigned');
    }

    await prisma.role.delete({ where: { id } });
    return { success: true, message: 'Role deleted' };
  }

  static async bulkDeleteRoles(ids: string[]) {
    const roles = await prisma.role.findMany({
      where: { id: { in: ids } },
      select: { id: true, _count: { select: { users: true } } },
    });

    const inUse = roles.filter((r) => r._count.users > 0).map((r) => r.id);
    if (inUse.length > 0) {
      throw new AppError(409, 'ROLE_IN_USE', `Roles in use: ${inUse.join(',')}`);
    }

    const result = await prisma.role.deleteMany({ where: { id: { in: ids } } });
    return { deleted: result.count };
  }

  static async exportRoles() {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true, _count: { select: { users: true, permissions: true } } },
    });

    const header = 'id,name,description,users,permissions\n';
    const rows = roles
      .map((r) => {
        const safe = (v: any) => `"${String(v ?? '').replace(/\"/g, '\"\"')}"`;
        return [safe(r.id), safe(r.name), safe(r.description), r._count.users, r._count.permissions].join(',');
      })
      .join('\n');

    return header + rows + '\n';
  }
}
