import crypto from 'crypto';
import { prisma } from '../../prisma';
import type { ModerationDecision, ModerationRequest } from './types';

export type ModerationJobRow = {
  id: string;
  status: string;
  request: string;
  attempts: number;
  nextRunAt: string | null;
  lockedAt: string | null;
  lockedBy: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export class ModerationJobRepository {
  static async enqueue(req: ModerationRequest) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const payload = JSON.stringify(req);
    await prisma.$executeRaw`
      INSERT INTO "moderation_jobs" (
        "id","status","request","attempts","nextRunAt","lockedAt","lockedBy","lastError","createdAt","updatedAt"
      ) VALUES (
        ${id}, 'pending', ${payload}, 0, ${now}, null, null, null, ${now}, ${now}
      )
    `;
    return id;
  }

  static async claimBatch(workerId: string, limit: number) {
    const now = new Date().toISOString();
    const rows = (await prisma.$queryRaw`
      SELECT "id","status","request","attempts","nextRunAt","lockedAt","lockedBy","lastError","createdAt","updatedAt"
      FROM "moderation_jobs"
      WHERE "status" = 'pending' AND ("nextRunAt" IS NULL OR "nextRunAt" <= ${now})
      ORDER BY "createdAt" ASC
      LIMIT ${limit}
    `) as ModerationJobRow[];

    const claimed: ModerationJobRow[] = [];
    for (const row of rows) {
      const updated = await prisma.$executeRaw`
        UPDATE "moderation_jobs"
        SET "status" = 'processing', "lockedAt" = ${now}, "lockedBy" = ${workerId}, "updatedAt" = ${now}
        WHERE "id" = ${row.id} AND "status" = 'pending'
      `;
      if (Number(updated) > 0) {
        claimed.push({ ...row, status: 'processing', lockedAt: now, lockedBy: workerId, updatedAt: now });
      }
    }
    return claimed;
  }

  static async markDone(jobId: string, decision: ModerationDecision, req: ModerationRequest) {
    const now = new Date().toISOString();
    const decisionId = crypto.randomUUID();
    const labels = JSON.stringify(decision.labels || []);
    const reasons = JSON.stringify(decision.reasons || []);

    await prisma.$executeRaw`
      INSERT INTO "moderation_decisions" (
        "id","jobId","businessLine","targetType","targetId","contentType","field","status","labels","reasons","score","provider","traceId","createdAt"
      ) VALUES (
        ${decisionId},
        ${jobId},
        ${req.businessLine},
        ${req.targetType},
        ${req.targetId},
        ${req.contentType},
        ${req.field || null},
        ${decision.status},
        ${labels},
        ${reasons},
        ${decision.score ?? null},
        ${decision.provider || null},
        ${req.traceId || null},
        ${now}
      )
    `;

    await prisma.$executeRaw`
      UPDATE "moderation_jobs"
      SET "status" = 'done', "updatedAt" = ${now}
      WHERE "id" = ${jobId}
    `;

    return { decisionId };
  }

  static async markFailed(jobId: string, errMsg: string, attempts: number, nextRunAtIso: string) {
    const now = new Date().toISOString();
    await prisma.$executeRaw`
      UPDATE "moderation_jobs"
      SET
        "status" = 'pending',
        "attempts" = ${attempts},
        "nextRunAt" = ${nextRunAtIso},
        "lastError" = ${errMsg},
        "lockedAt" = null,
        "lockedBy" = null,
        "updatedAt" = ${now}
      WHERE "id" = ${jobId}
    `;
  }

  static async markDead(jobId: string, errMsg: string) {
    const now = new Date().toISOString();
    await prisma.$executeRaw`
      UPDATE "moderation_jobs"
      SET "status" = 'dead', "lastError" = ${errMsg}, "updatedAt" = ${now}
      WHERE "id" = ${jobId}
    `;
  }
}
