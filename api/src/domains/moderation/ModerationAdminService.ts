import crypto from 'crypto';
import { prisma } from '../../prisma';
import { Prisma } from '@prisma/client';
import type { ModerationDecisionStatus, ModerationTargetType } from './types';

type ListParams = {
  status?: ModerationDecisionStatus;
  targetType?: ModerationTargetType;
  targetId?: string;
  limit: number;
  offset: number;
};

export class ModerationAdminService {
  static async listDecisions(params: ListParams) {
    const where: Prisma.Sql[] = [];
    if (params.status) where.push(Prisma.sql`"status" = ${params.status}`);
    if (params.targetType) where.push(Prisma.sql`"targetType" = ${params.targetType}`);
    if (params.targetId) where.push(Prisma.sql`"targetId" = ${params.targetId}`);

    const whereSql = where.length > 0 ? Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}` : Prisma.sql``;

    const rows = await prisma.$queryRaw`
      SELECT "id","jobId","businessLine","targetType","targetId","contentType","field","status","labels","reasons","score","provider","traceId","createdAt"
      FROM "moderation_decisions"
      ${whereSql}
      ORDER BY "createdAt" DESC
      LIMIT ${params.limit}
      OFFSET ${params.offset}
    `;

    return rows as any[];
  }

  static async getMetrics(sinceMinutes: number) {
    const since = new Date(Date.now() - sinceMinutes * 60_000).toISOString();

    const byStatus = await prisma.$queryRaw`
      SELECT "status", COUNT(1) as "count"
      FROM "moderation_decisions"
      WHERE "createdAt" >= ${since}
      GROUP BY "status"
    `;

    const byProvider = await prisma.$queryRaw`
      SELECT COALESCE("provider",'unknown') as "provider", COUNT(1) as "count"
      FROM "moderation_decisions"
      WHERE "createdAt" >= ${since}
      GROUP BY COALESCE("provider",'unknown')
      ORDER BY "count" DESC
      LIMIT 20
    `;

    const byTargetType = await prisma.$queryRaw`
      SELECT "targetType", COUNT(1) as "count"
      FROM "moderation_decisions"
      WHERE "createdAt" >= ${since}
      GROUP BY "targetType"
      ORDER BY "count" DESC
      LIMIT 20
    `;

    const toNum = (rows: any[]) =>
      rows.map((r) => ({ ...r, count: Number(r.count) }));

    return {
      since,
      byStatus: toNum(byStatus as any[]),
      byProvider: toNum(byProvider as any[]),
      byTargetType: toNum(byTargetType as any[]),
    };
  }

  static async manualDecision(input: {
    actorUserId?: string;
    targetType: ModerationTargetType;
    targetId: string;
    status: ModerationDecisionStatus;
    labels?: string[];
    reasons?: string[];
    traceId?: string;
  }) {
    const now = new Date().toISOString();
    const decisionId = crypto.randomUUID();
    const auditId = crypto.randomUUID();
    const labels = JSON.stringify((input.labels || []).slice(0, 20));
    const reasons = JSON.stringify((input.reasons || []).slice(0, 50));

    await prisma.$executeRaw`
      INSERT INTO "moderation_decisions" (
        "id","jobId","businessLine","targetType","targetId","contentType","field","status","labels","reasons","score","provider","traceId","createdAt"
      ) VALUES (
        ${decisionId},
        'manual',
        'manual',
        ${input.targetType},
        ${input.targetId},
        'text',
        null,
        ${input.status},
        ${labels},
        ${reasons},
        null,
        'manual',
        ${input.traceId || null},
        ${now}
      )
    `;

    await prisma.$executeRaw`
      INSERT INTO "moderation_audit_logs" (
        "id","action","actorUserId","targetType","targetId","decisionId","payload","traceId","createdAt"
      ) VALUES (
        ${auditId},
        'manual_decision',
        ${input.actorUserId || null},
        ${input.targetType},
        ${input.targetId},
        ${decisionId},
        null,
        ${input.traceId || null},
        ${now}
      )
    `;

    return { decisionId };
  }
}
