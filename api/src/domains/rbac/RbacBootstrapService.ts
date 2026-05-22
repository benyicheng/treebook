import { prisma } from '../../prisma';

type PermDef = { code: string; description?: string };
type RoleDef = { name: string; description?: string; permissions: string[] };

const basePermissions: PermDef[] = [
  { code: 'editorial:view', description: '查看编辑改稿记录' },
  { code: 'editorial:propose', description: '创建/提交编辑改稿建议' },
  { code: 'editorial:apply', description: '应用编辑改稿到正文' },
  { code: 'review:case:view', description: '查看人工复核工单' },
  { code: 'review:case:act', description: '处理人工复核工单' },
  { code: 'review:case:l1', description: 'L1 工单处理权限' },
  { code: 'review:case:l2', description: 'L2 工单处理权限' },
  { code: 'review:case:final', description: '终审工单处理权限' },
  { code: 'review:case:any', description: '跨级别工单处理权限' },
];

const baseRoles: RoleDef[] = [
  { name: 'editor', description: '编辑（可提交改稿建议）', permissions: ['editorial:view', 'editorial:propose'] },
  { name: 'editor_lead', description: '主编（可应用改稿）', permissions: ['editorial:view', 'editorial:propose', 'editorial:apply'] },
  { name: 'reviewer_l1', description: '审核员 L1', permissions: ['review:case:view', 'review:case:act', 'review:case:l1'] },
  { name: 'reviewer_l2', description: '审核员 L2', permissions: ['review:case:view', 'review:case:act', 'review:case:l2'] },
  { name: 'reviewer_final', description: '审核员 终审', permissions: ['review:case:view', 'review:case:act', 'review:case:final'] },
];

export class RbacBootstrapService {
  static async ensureBaseRbac() {
    const permIdsByCode = new Map<string, string>();

    await prisma.$transaction(async (tx) => {
      for (const p of basePermissions) {
        const row = await tx.permission.upsert({
          where: { code: p.code },
          update: { description: p.description },
          create: { code: p.code, description: p.description },
          select: { id: true, code: true },
        });
        permIdsByCode.set(row.code, row.id);
      }

      const roleIdsByName = new Map<string, string>();
      for (const r of baseRoles) {
        const role = await tx.role.upsert({
          where: { name: r.name },
          update: { description: r.description },
          create: { name: r.name, description: r.description },
          select: { id: true, name: true },
        });
        roleIdsByName.set(role.name, role.id);
      }

      for (const r of baseRoles) {
        const roleId = roleIdsByName.get(r.name)!;
        const permissionIds = r.permissions.map((c) => permIdsByCode.get(c)!).filter(Boolean);
        if (permissionIds.length === 0) continue;
        for (const pid of permissionIds) {
          try {
            await tx.rolePermission.create({ data: { roleId, permissionId: pid } });
          } catch (e: any) {
            if (e?.code !== 'P2002') throw e;
          }
        }
      }
    });

    return { ok: true, permissions: basePermissions.map((p) => p.code), roles: baseRoles.map((r) => r.name) };
  }
}

