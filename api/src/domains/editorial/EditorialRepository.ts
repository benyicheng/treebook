import crypto from 'crypto';
import { prisma } from '../../prisma';
import { Prisma } from '@prisma/client';
import type { EditorialChangeDetail, EditorialChangeRow, EditorialChangeStatus, EditorialField, EditorialTargetType } from './types';

export class EditorialRepository {
  static async createChange(input: {
    targetType: EditorialTargetType;
    targetId: string;
    field: EditorialField;
    status: EditorialChangeStatus;
    original: string | null;
    proposed: string;
    createdBy: string | null;
  }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await prisma.$executeRaw`
      INSERT INTO "editorial_changes" (
        "id","targetType","targetId","field","status","original","proposed","appliedBy","createdBy","createdAt","updatedAt"
      ) VALUES (
        ${id},
        ${input.targetType},
        ${input.targetId},
        ${input.field},
        ${input.status},
        ${input.original},
        ${input.proposed},
        null,
        ${input.createdBy},
        ${now},
        ${now}
      )
    `;
    return id;
  }

  static async addAction(changeId: string, input: { action: string; actorUserId: string | null; payload?: unknown }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const payload = input.payload === undefined ? null : JSON.stringify(input.payload);
    await prisma.$executeRaw`
      INSERT INTO "editorial_change_actions" ("id","changeId","action","actorUserId","payload","createdAt")
      VALUES (${id}, ${changeId}, ${input.action}, ${input.actorUserId}, ${payload}, ${now})
    `;
    return id;
  }

  static async listChanges(params: { status?: string; targetType?: string; targetId?: string; limit: number; offset: number }) {
    const where: Prisma.Sql[] = [];
    if (params.status) where.push(Prisma.sql`"status" = ${params.status}`);
    if (params.targetType) where.push(Prisma.sql`"targetType" = ${params.targetType}`);
    if (params.targetId) where.push(Prisma.sql`"targetId" = ${params.targetId}`);
    const whereSql = where.length > 0 ? Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}` : Prisma.sql``;

    const rows = (await prisma.$queryRaw`
      SELECT "id","targetType","targetId","field","status","original","proposed","appliedBy","createdBy","createdAt","updatedAt"
      FROM "editorial_changes"
      ${whereSql}
      ORDER BY "updatedAt" DESC
      LIMIT ${params.limit}
      OFFSET ${params.offset}
    `) as EditorialChangeRow[];

    return rows;
  }

  static async getChangeById(id: string): Promise<EditorialChangeDetail | null> {
    const rows = (await prisma.$queryRaw`
      SELECT "id","targetType","targetId","field","status","original","proposed","appliedBy","createdBy","createdAt","updatedAt"
      FROM "editorial_changes"
      WHERE "id" = ${id}
      LIMIT 1
    `) as EditorialChangeRow[];
    const row = rows[0];
    if (!row) return null;

    const actions = (await prisma.$queryRaw`
      SELECT "id","changeId","action","actorUserId","payload","createdAt"
      FROM "editorial_change_actions"
      WHERE "changeId" = ${id}
      ORDER BY "createdAt" ASC
    `) as any[];

    return { ...(row as any), actions };
  }

  static async setStatus(changeId: string, status: EditorialChangeStatus, appliedBy?: string | null) {
    const now = new Date().toISOString();
    await prisma.$executeRaw`
      UPDATE "editorial_changes"
      SET "status" = ${status}, "appliedBy" = ${appliedBy || null}, "updatedAt" = ${now}
      WHERE "id" = ${changeId}
    `;
  }
}

