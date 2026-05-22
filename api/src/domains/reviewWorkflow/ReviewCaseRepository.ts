import crypto from 'crypto';
import { prisma } from '../../prisma';
import { Prisma } from '@prisma/client';
import type { ModerationContentType, ModerationTargetType } from '../moderation/types';
import type { ReviewCaseActionType, ReviewCaseRow, ReviewCaseWithActions } from './types';

type CreateCaseInput = {
  businessLine: string;
  targetType: ModerationTargetType;
  targetId: string;
  contentType: ModerationContentType;
  field?: string | null;
  sourceDecisionId?: string | null;
  snapshot?: unknown;
  level?: number;
};

export class ReviewCaseRepository {
  static async findOpenCase(params: {
    targetType: ModerationTargetType;
    targetId: string;
    contentType: ModerationContentType;
    field?: string | null;
  }) {
    const rows = (await prisma.$queryRaw`
      SELECT "id","businessLine","targetType","targetId","contentType","field","status","level","assigneeUserId","sourceDecisionId","snapshot","dueAt","reopenedCount","createdAt","updatedAt"
      FROM "moderation_cases"
      WHERE
        "targetType" = ${params.targetType}
        AND "targetId" = ${params.targetId}
        AND "contentType" = ${params.contentType}
        AND (("field" IS NULL AND ${params.field || null} IS NULL) OR "field" = ${params.field || null})
        AND "status" IN ('open','in_review','returned')
      ORDER BY "updatedAt" DESC
      LIMIT 1
    `) as ReviewCaseRow[];
    return rows[0] || null;
  }

  static async createCase(input: CreateCaseInput) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const snapshot = input.snapshot === undefined ? null : JSON.stringify(input.snapshot);
    const level = Math.max(1, Math.min(5, input.level ?? 1));

    await prisma.$executeRaw`
      INSERT INTO "moderation_cases" (
        "id","businessLine","targetType","targetId","contentType","field","status","level","assigneeUserId","sourceDecisionId","snapshot","createdAt","updatedAt"
      ) VALUES (
        ${id},
        ${input.businessLine},
        ${input.targetType},
        ${input.targetId},
        ${input.contentType},
        ${input.field || null},
        'open',
        ${level},
        null,
        ${input.sourceDecisionId || null},
        ${snapshot},
        ${now},
        ${now}
      )
    `;

    await this.addAction(id, {
      action: 'create',
      actorUserId: null,
      payload: { sourceDecisionId: input.sourceDecisionId || null },
    });

    return id;
  }

  static async listCases(params: { status?: string; level?: number; limit: number; offset: number }) {
    const where: Prisma.Sql[] = [];
    if (params.status) where.push(Prisma.sql`"status" = ${params.status}`);
    if (params.level) where.push(Prisma.sql`"level" = ${params.level}`);

    const whereSql = where.length > 0 ? Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}` : Prisma.sql``;

    const rows = (await prisma.$queryRaw`
      SELECT "id","businessLine","targetType","targetId","contentType","field","status","level","assigneeUserId","sourceDecisionId","snapshot","dueAt","reopenedCount","createdAt","updatedAt"
      FROM "moderation_cases"
      ${whereSql}
      ORDER BY "updatedAt" DESC
      LIMIT ${params.limit}
      OFFSET ${params.offset}
    `) as ReviewCaseRow[];

    return rows;
  }

  static async getCaseById(caseId: string): Promise<ReviewCaseWithActions | null> {
    const rows = (await prisma.$queryRaw`
      SELECT "id","businessLine","targetType","targetId","contentType","field","status","level","assigneeUserId","sourceDecisionId","snapshot","dueAt","reopenedCount","createdAt","updatedAt"
      FROM "moderation_cases"
      WHERE "id" = ${caseId}
      LIMIT 1
    `) as ReviewCaseRow[];
    const row = rows[0];
    if (!row) return null;

    const actions = (await prisma.$queryRaw`
      SELECT "id","caseId","action","actorUserId","payload","createdAt"
      FROM "moderation_case_actions"
      WHERE "caseId" = ${caseId}
      ORDER BY "createdAt" ASC
    `) as any[];

    return { ...(row as any), actions };
  }

  static async setCaseStatus(caseId: string, status: string) {
    const now = new Date().toISOString();
    await prisma.$executeRaw`
      UPDATE "moderation_cases"
      SET "status" = ${status}, "updatedAt" = ${now}
      WHERE "id" = ${caseId}
    `;
  }

  static async setDueAt(caseId: string, dueAtIso: string | null) {
    const now = new Date().toISOString();
    await prisma.$executeRaw`
      UPDATE "moderation_cases"
      SET "dueAt" = ${dueAtIso}, "updatedAt" = ${now}
      WHERE "id" = ${caseId}
    `;
  }

  static async moveToLevel(caseId: string, nextLevel: number) {
    const now = new Date().toISOString();
    await prisma.$executeRaw`
      UPDATE "moderation_cases"
      SET "level" = ${nextLevel}, "status" = 'open', "assigneeUserId" = null, "updatedAt" = ${now}
      WHERE "id" = ${caseId}
    `;
  }

  static async reopenWithSnapshot(caseId: string, snapshot: unknown, sourceDecisionId: string | null) {
    const now = new Date().toISOString();
    const payload = JSON.stringify(snapshot);
    await prisma.$executeRaw`
      UPDATE "moderation_cases"
      SET
        "status" = 'open',
        "assigneeUserId" = null,
        "snapshot" = ${payload},
        "sourceDecisionId" = ${sourceDecisionId},
        "reopenedCount" = "reopenedCount" + 1,
        "updatedAt" = ${now}
      WHERE "id" = ${caseId}
    `;
  }


  static async assign(caseId: string, assigneeUserId: string | null) {
    const now = new Date().toISOString();
    await prisma.$executeRaw`
      UPDATE "moderation_cases"
      SET "assigneeUserId" = ${assigneeUserId}, "status" = 'in_review', "updatedAt" = ${now}
      WHERE "id" = ${caseId}
    `;
  }

  static async addAction(caseId: string, input: { action: ReviewCaseActionType; actorUserId: string | null; payload?: unknown }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const payload = input.payload === undefined ? null : JSON.stringify(input.payload);
    await prisma.$executeRaw`
      INSERT INTO "moderation_case_actions" ("id","caseId","action","actorUserId","payload","createdAt")
      VALUES (${id}, ${caseId}, ${input.action}, ${input.actorUserId}, ${payload}, ${now})
    `;
    return id;
  }
}
