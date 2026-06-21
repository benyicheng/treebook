/**
 * Phase 3 数据回填脚本：把 chapter-level 关联升级为 event-level 精度。
 *
 * 用法：
 *   tsx prisma/migrate_event_connector.ts            # dry-run（默认，不写入）
 *   tsx prisma/migrate_event_connector.ts --apply    # 真实写入
 *
 * 回填逻辑：
 *   1. Branch.parentEventId
 *      - 对每个 parentEventId 为 null 的 Branch，
 *        找该 parentChapterId 关联的事件（StoryEventNode where targetType='chapter'）。
 *      - 多个事件命中时选 sortOrder 最小的（保守：选"最早出现"的事件作为分支起点）。
 *   2. Spinoff.originalEventId
 *      - 优先看 originalChapterId 关联的事件；无则看 originalBranchId 关联的事件。
 *
 * 安全保障：
 *   - 只 UPDATE WHERE parentEventId/originalEventId IS NULL，不会覆盖已有值。
 *   - 全程在 prisma.$transaction 内执行（要么全成要么全失败）。
 *   - dry-run 默认开启，需显式 --apply 才写库。
 *   - 输出 diff 报告便于审查。
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Plan {
  branchUpdates: Array<{ id: string; title: string; parentEventId: string; eventTitle: string }>;
  spinoffUpdates: Array<{
    id: string;
    title: string;
    originalEventId: string;
    eventTitle: string;
    via: 'chapter' | 'branch';
  }>;
}

async function buildPlan(): Promise<Plan> {
  const plan: Plan = { branchUpdates: [], spinoffUpdates: [] };

  // ── 1. Branch 回填 ─────────────────────────────────────────────────
  const orphanBranches = await prisma.branch.findMany({
    where: { parentEventId: null },
    select: { id: true, title: true, parentChapterId: true },
  });
  console.log(`[branch] ${orphanBranches.length} 个 Branch 未设 parentEventId`);

  for (const br of orphanBranches) {
    // 该 chapter 上的事件节点（取 sortOrder 最小的事件）
    const node = await prisma.storyEventNode.findFirst({
      where: { targetType: 'chapter', targetId: br.parentChapterId },
      orderBy: { event: { sortOrder: 'asc' } },
      include: { event: { select: { id: true, title: true } } },
    });
    if (!node?.event) continue;
    plan.branchUpdates.push({
      id: br.id,
      title: br.title,
      parentEventId: node.event.id,
      eventTitle: node.event.title,
    });
  }

  // ── 2. Spinoff 回填 ─────────────────────────────────────────────────
  const orphanSpinoffs = await prisma.spinoff.findMany({
    where: { originalEventId: null },
    select: {
      id: true,
      title: true,
      originalChapterId: true,
      originalBranchId: true,
    },
  });
  console.log(`[spinoff] ${orphanSpinoffs.length} 个 Spinoff 未设 originalEventId`);

  for (const sp of orphanSpinoffs) {
    let event: { id: string; title: string } | null = null;
    let via: 'chapter' | 'branch' = 'chapter';

    if (sp.originalChapterId) {
      const node = await prisma.storyEventNode.findFirst({
        where: { targetType: 'chapter', targetId: sp.originalChapterId },
        orderBy: { event: { sortOrder: 'asc' } },
        include: { event: { select: { id: true, title: true } } },
      });
      if (node?.event) {
        event = node.event;
        via = 'chapter';
      }
    }
    if (!event && sp.originalBranchId) {
      const node = await prisma.storyEventNode.findFirst({
        where: { targetType: 'branch', targetId: sp.originalBranchId },
        orderBy: { event: { sortOrder: 'asc' } },
        include: { event: { select: { id: true, title: true } } },
      });
      if (node?.event) {
        event = node.event;
        via = 'branch';
      }
    }

    if (!event) continue;
    plan.spinoffUpdates.push({
      id: sp.id,
      title: sp.title,
      originalEventId: event.id,
      eventTitle: event.title,
      via,
    });
  }

  return plan;
}

function printPlan(plan: Plan): void {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`回填计划：${plan.branchUpdates.length} 个 Branch + ${plan.spinoffUpdates.length} 个 Spinoff`);
  console.log('═══════════════════════════════════════════════════════════');

  if (plan.branchUpdates.length) {
    console.log('\n【Branch.parentEventId】');
    for (const u of plan.branchUpdates) {
      console.log(`  ${u.id.slice(0, 8)} "${u.title}" → 事件 "${u.eventTitle}" (${u.parentEventId.slice(0, 8)})`);
    }
  }
  if (plan.spinoffUpdates.length) {
    console.log('\n【Spinoff.originalEventId】');
    for (const u of plan.spinoffUpdates) {
      console.log(`  ${u.id.slice(0, 8)} "${u.title}" → 事件 "${u.eventTitle}" (${u.originalEventId.slice(0, 8)}) [via ${u.via}]`);
    }
  }
  console.log('');
}

async function applyPlan(plan: Plan): Promise<void> {
  console.log('\n开始写入...');
  await prisma.$transaction(async (tx) => {
    for (const u of plan.branchUpdates) {
      await tx.branch.update({
        where: { id: u.id, parentEventId: null }, // 双重保护：仅 null 才更新
        data: { parentEventId: u.parentEventId },
      });
    }
    for (const u of plan.spinoffUpdates) {
      await tx.spinoff.update({
        where: { id: u.id, originalEventId: null },
        data: { originalEventId: u.originalEventId },
      });
    }
  });
  console.log(`✔ 完成：写入 ${plan.branchUpdates.length} Branch + ${plan.spinoffUpdates.length} Spinoff`);
}

async function main() {
  const apply = process.argv.includes('--apply');
  console.log(apply ? '【模式】真实写入 (--apply)' : '【模式】dry-run（预览，不写库）');

  const plan = await buildPlan();
  printPlan(plan);

  if (!apply) {
    console.log('已生成预览。执行 `tsx prisma/migrate_event_connector.ts --apply` 真实写入。');
    return;
  }
  if (plan.branchUpdates.length === 0 && plan.spinoffUpdates.length === 0) {
    console.log('无需要回填的记录。');
    return;
  }
  await applyPlan(plan);
}

main()
  .catch((err) => {
    console.error('回填失败:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
