import { Router, Response } from 'express';
import { authenticate, AuthRequest, requirePermission } from '../middleware/auth';
import { prisma } from '../prisma';
import { sendErr, sendOk } from '../utils/http';

const router = Router();
const permissionsCache: { data: any[] | null; expiresAt: number } = { data: null, expiresAt: 0 };

const getTraceId = (req: any) => req.traceId as string | undefined;

const parseIntParam = (v: any, def: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
};

const dedupe = (arr: unknown) => {
  if (!Array.isArray(arr)) return [];
  return Array.from(new Set(arr.filter((x) => typeof x === 'string'))) as string[];
};

router.get('/', authenticate, requirePermission('role:read'), async (req: AuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const page = parseIntParam((req.query as any).page, 1);
  const pageSize = Math.min(parseIntParam((req.query as any).pageSize, 20), 100);
  const q = typeof (req.query as any).q === 'string' ? (req.query as any).q.trim() : '';

  try {
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

    sendOk(res, { items, total, page, pageSize }, traceId);
  } catch (e: any) {
    sendErr(res, 'ROLE_LIST_FAILED', e.message || 'Failed to list roles', traceId, 500);
  }
});

router.post('/', authenticate, requirePermission('role:create'), async (req: AuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const { name, description, permissionIds } = req.body;
  try {
    if (!name || typeof name !== 'string' || !name.trim()) {
      return sendErr(res, 'VALIDATION_ERROR', 'name is required', traceId, 400);
    }

    const pids = dedupe(permissionIds);
    const permissionCount = await prisma.permission.count({ where: { id: { in: pids } } });
    if (permissionCount !== pids.length) {
      return sendErr(res, 'VALIDATION_ERROR', 'permissionIds contains invalid id', traceId, 400);
    }

    const role = await prisma.role.create({
      data: {
        name: name.trim(),
        description: typeof description === 'string' ? description : undefined,
        permissions: {
          create: pids.map((pid) => ({
            permissionId: pid
          }))
        }
      },
      select: { id: true, name: true, description: true }
    });

    sendOk(res, role, traceId, 201);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return sendErr(res, 'ROLE_NAME_CONFLICT', 'Role name already exists', traceId, 409);
    }
    sendErr(res, 'ROLE_CREATE_FAILED', e.message || 'Failed to create role', traceId, 500);
  }
});

router.get('/:id([0-9a-fA-F-]{36})', authenticate, requirePermission('role:read'), async (req: AuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const { id } = req.params;

  try {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });

    if (!role) return sendErr(res, 'NOT_FOUND', 'Role not found', traceId, 404);
    sendOk(res, role, traceId);
  } catch (e: any) {
    sendErr(res, 'ROLE_GET_FAILED', e.message || 'Failed to fetch role', traceId, 500);
  }
});

router.put('/:id([0-9a-fA-F-]{36})', authenticate, requirePermission('role:update'), async (req: AuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const { id } = req.params;
  const { name, description } = req.body || {};

  try {
    const existing = await prisma.role.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return sendErr(res, 'NOT_FOUND', 'Role not found', traceId, 404);

    if (name && (typeof name !== 'string' || !name.trim())) {
      return sendErr(res, 'VALIDATION_ERROR', 'name is invalid', traceId, 400);
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        name: typeof name === 'string' ? name.trim() : undefined,
        description: typeof description === 'string' ? description : undefined,
      },
      select: { id: true, name: true, description: true },
    });

    sendOk(res, role, traceId);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return sendErr(res, 'ROLE_NAME_CONFLICT', 'Role name already exists', traceId, 409);
    }
    sendErr(res, 'ROLE_UPDATE_FAILED', e.message || 'Failed to update role', traceId, 500);
  }
});

router.put('/:id([0-9a-fA-F-]{36})/permissions', authenticate, requirePermission('role:permission:assign'), async (req: AuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const { id } = req.params;
  const { permissionIds } = req.body; // Array of permission IDs

  try {
    const exists = await prisma.role.findUnique({ where: { id }, select: { id: true } });
    if (!exists) return sendErr(res, 'NOT_FOUND', 'Role not found', traceId, 404);

    const pids = dedupe(permissionIds);
    const permissionCount = await prisma.permission.count({ where: { id: { in: pids } } });
    if (permissionCount !== pids.length) {
      return sendErr(res, 'VALIDATION_ERROR', 'permissionIds contains invalid id', traceId, 400);
    }

    // Transaction to replace permissions
    await prisma.$transaction(async (tx) => {
      // Delete existing
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      
      // Create new
      if (pids.length > 0) {
        await tx.rolePermission.createMany({
          data: pids.map((pid) => ({
            roleId: id,
            permissionId: pid
          })),
        });
      }
    });
    
    sendOk(res, { message: 'Permissions updated' }, traceId);
  } catch (e: any) {
    sendErr(res, 'ROLE_PERMISSION_UPDATE_FAILED', e.message || 'Failed to update permissions', traceId, 500);
  }
});

router.get('/permissions', authenticate, requirePermission('role:read'), async (req: AuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const q = typeof (req.query as any).q === 'string' ? (req.query as any).q.trim() : '';

  try {
    const now = Date.now();
    if (!q && permissionsCache.data && permissionsCache.expiresAt > now) {
      return sendOk(res, permissionsCache.data, traceId);
    }

    const permissions = await prisma.permission.findMany({
      where: q
        ? {
            OR: [
              { code: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : undefined,
      orderBy: { code: 'asc' },
    });

    if (!q) {
      permissionsCache.data = permissions;
      permissionsCache.expiresAt = now + 60_000;
    }

    sendOk(res, permissions, traceId);
  } catch (e: any) {
    sendErr(res, 'PERMISSION_LIST_FAILED', e.message || 'Failed to list permissions', traceId, 500);
  }
});

router.delete('/:id([0-9a-fA-F-]{36})', authenticate, requirePermission('role:delete'), async (req: AuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const { id } = req.params;

  try {
    const role = await prisma.role.findUnique({
      where: { id },
      select: { id: true, _count: { select: { users: true } } },
    });
    if (!role) return sendErr(res, 'NOT_FOUND', 'Role not found', traceId, 404);
    if (role._count.users > 0) {
      return sendErr(res, 'ROLE_IN_USE', 'Role has users assigned', traceId, 409);
    }

    await prisma.role.delete({ where: { id } });
    sendOk(res, { message: 'Role deleted' }, traceId);
  } catch (e: any) {
    sendErr(res, 'ROLE_DELETE_FAILED', e.message || 'Failed to delete role', traceId, 500);
  }
});

router.post('/bulk-delete', authenticate, requirePermission('role:delete'), async (req: AuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const ids = dedupe(req.body?.ids);
  if (ids.length === 0) return sendErr(res, 'VALIDATION_ERROR', 'ids is required', traceId, 400);

  try {
    const roles = await prisma.role.findMany({
      where: { id: { in: ids } },
      select: { id: true, _count: { select: { users: true } } },
    });

    const inUse = roles.filter((r) => r._count.users > 0).map((r) => r.id);
    if (inUse.length > 0) {
      return sendErr(res, 'ROLE_IN_USE', `Roles in use: ${inUse.join(',')}`, traceId, 409);
    }

    const result = await prisma.role.deleteMany({ where: { id: { in: ids } } });
    sendOk(res, { deleted: result.count }, traceId);
  } catch (e: any) {
    sendErr(res, 'ROLE_BULK_DELETE_FAILED', e.message || 'Failed to bulk delete roles', traceId, 500);
  }
});

router.get('/export', authenticate, requirePermission('role:read'), async (req: AuthRequest, res: Response) => {
  const traceId = getTraceId(req);
  const format = typeof (req.query as any).format === 'string' ? (req.query as any).format : 'csv';

  if (format !== 'csv') return sendErr(res, 'VALIDATION_ERROR', 'format must be csv', traceId, 400);

  try {
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

    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.setHeader('content-disposition', 'attachment; filename="roles.csv"');
    res.setHeader('x-trace-id', traceId || '');
    res.status(200).send(header + rows + '\n');
  } catch (e: any) {
    sendErr(res, 'ROLE_EXPORT_FAILED', e.message || 'Failed to export roles', traceId, 500);
  }
});

export default router;
