import crypto from 'crypto';
import type { Request } from 'express';
import { AppError } from '../../utils/http';
import { prisma } from '../../prisma';
import { sanitizeSensitive, normalizeText } from './sensitive';
import { EditorialRepository } from './EditorialRepository';
import type { EditorialChangeDetail, EditorialField, EditorialTargetType, EditorialChangeStatus } from './types';
import type { ModerationTargetType, ModerationContentType } from '../moderation/types';
import { ReviewWorkflowService } from '../reviewWorkflow/ReviewWorkflowService';
import { ModerationGateway } from '../moderation/ModerationGateway';

interface Actor {
  id: string;
  role: string;
  permissions?: string[];
}

const getCurrentValue = async (targetType: EditorialTargetType, targetId: string, field: EditorialField): Promise<string | null> => {
  if (targetType === 'story') {
    const row = await prisma.story.findUnique({ where: { id: targetId }, select: { id: true, title: true, description: true, coverImage: true } });
    if (!row) return null;
    if (field === 'title') return row.title || '';
    if (field === 'description') return row.description || '';
    if (field === 'coverImage') return row.coverImage || '';
    return null;
  }
  if (targetType === 'chapter') {
    const row = await prisma.chapter.findUnique({ where: { id: targetId }, select: { id: true, title: true, content: true } });
    if (!row) return null;
    if (field === 'title') return row.title || '';
    if (field === 'content') return row.content || '';
    return null;
  }
  if (targetType === 'spinoff') {
    const row = await prisma.spinoff.findUnique({ where: { id: targetId }, select: { id: true, title: true, content: true } });
    if (!row) return null;
    if (field === 'title') return row.title || '';
    if (field === 'content') return row.content || '';
    return null;
  }
  if (targetType === 'booklist') {
    const row = await prisma.booklist.findUnique({ where: { id: targetId }, select: { id: true, title: true, description: true } });
    if (!row) return null;
    if (field === 'title') return row.title || '';
    if (field === 'description') return row.description || '';
    return null;
  }
  return null;
};

const canPropose = (user: Actor | null | undefined): boolean => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return Array.isArray(user.permissions) && user.permissions.includes('editorial:propose');
};

export class EditorialService {
  static async createChange(input: {
    actor: Actor | null;
    targetType: EditorialTargetType;
    targetId: string;
    field: EditorialField;
    proposed: string;
    submit?: boolean;
    sanitize?: boolean;
    normalize?: boolean;
  }) {
    if (!canPropose(input.actor)) throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
    const original = await getCurrentValue(input.targetType, input.targetId, input.field);
    if (original === null) throw new AppError(404, 'NOT_FOUND', 'Target not found');

    let proposed = String(input.proposed || '');
    const audit: Record<string, unknown> = {};
    if (input.normalize !== false) {
      proposed = normalizeText(proposed);
      audit.normalized = true;
    }
    if (input.sanitize) {
      const r = sanitizeSensitive(proposed);
      proposed = r.text;
      audit.sensitiveHits = r.hits;
    }
    if (!proposed.trim()) throw new AppError(400, 'BAD_REQUEST', 'proposed 不能为空');

    const status: EditorialChangeStatus = input.submit === false ? 'draft' : 'submitted';
    const id = await EditorialRepository.createChange({
      targetType: input.targetType,
      targetId: input.targetId,
      field: input.field,
      status,
      original,
      proposed,
      createdBy: input.actor?.id || null,
    });
    await EditorialRepository.addAction(id, { action: 'create', actorUserId: input.actor?.id || null, payload: audit });
    if (status === 'submitted') {
      await EditorialRepository.addAction(id, { action: 'submit', actorUserId: input.actor?.id || null });
    }
    return { id };
  }

  static async listChanges(input: { actor: Actor | null; status?: string; targetType?: string; targetId?: string; limit: number; offset: number }) {
    if (!input.actor) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');
    const limit = Math.max(1, Math.min(200, input.limit));
    const offset = Math.max(0, input.offset);
    return EditorialRepository.listChanges({ status: input.status, targetType: input.targetType, targetId: input.targetId, limit, offset });
  }

  static async getChangeById(input: { actor: Actor | null; id: string }): Promise<EditorialChangeDetail> {
    if (!input.actor) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');
    const row = await EditorialRepository.getChangeById(input.id);
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Not found');
    return row;
  }

  static async applyChange(input: { actor: Actor; id: string; traceReq?: Request }) {
    if (!input.actor) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');
    const row = await EditorialRepository.getChangeById(input.id);
    if (!row) throw new AppError(404, 'NOT_FOUND', 'Not found');
    if (row.status !== 'submitted' && row.status !== 'draft') throw new AppError(409, 'INVALID_STATE', 'Not applicable');

    const isAdmin = input.actor.role === 'admin';
    const canApply = isAdmin || (input.actor.permissions || []).includes('editorial:apply');
    if (!canApply) throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');

    await prisma.$transaction(async (tx) => {
      if (row.targetType === 'story') {
        if (row.field === 'title') await tx.story.update({ where: { id: row.targetId }, data: { title: row.proposed } });
        else if (row.field === 'description') await tx.story.update({ where: { id: row.targetId }, data: { description: row.proposed } });
        else if (row.field === 'coverImage') await tx.story.update({ where: { id: row.targetId }, data: { coverImage: row.proposed } });
        else throw new AppError(400, 'BAD_REQUEST', 'Unsupported field');
      } else if (row.targetType === 'chapter') {
        if (row.field === 'title') await tx.chapter.update({ where: { id: row.targetId }, data: { title: row.proposed } });
        else if (row.field === 'content') await tx.chapter.update({ where: { id: row.targetId }, data: { content: row.proposed } });
        else throw new AppError(400, 'BAD_REQUEST', 'Unsupported field');
      } else if (row.targetType === 'booklist') {
        if (row.field === 'title') await tx.booklist.update({ where: { id: row.targetId }, data: { title: row.proposed } });
        else if (row.field === 'description') await tx.booklist.update({ where: { id: row.targetId }, data: { description: row.proposed } });
        else throw new AppError(400, 'BAD_REQUEST', 'Unsupported field');
      } else {
        throw new AppError(400, 'BAD_REQUEST', 'Unsupported targetType');
      }

      await tx.$executeRaw`
        UPDATE "editorial_changes"
        SET "status" = 'applied', "appliedBy" = ${input.actor.id}, "updatedAt" = ${new Date().toISOString()}
        WHERE "id" = ${row.id}
      `;
      await tx.$executeRaw`
        INSERT INTO "editorial_change_actions" ("id","changeId","action","actorUserId","payload","createdAt")
        VALUES (${crypto.randomUUID()}, ${row.id}, 'apply', ${input.actor.id}, null, ${new Date().toISOString()})
      `;
    });

    const businessLine = row.targetType === 'story' ? 'stories' : row.targetType === 'chapter' ? 'chapters' : row.targetType === 'booklist' ? 'booklists' : 'content';
    const contentType = row.field === 'coverImage' ? 'image' : 'text';
    const snapshot = contentType === 'text' ? { text: row.proposed, field: row.field } : { mediaUrl: row.proposed, field: row.field };
    void ReviewWorkflowService.onContentUpdated({
      actorUserId: input.actor.id,
      businessLine,
      targetType: row.targetType as ModerationTargetType,
      targetId: row.targetId,
      contentType: contentType as ModerationContentType,
      field: row.field,
      snapshot,
    }).catch(() => {});

    if (input.traceReq) {
      if (contentType === 'text') {
        void ModerationGateway.enqueueText(input.traceReq, {
          businessLine,
          targetType: row.targetType as ModerationTargetType,
          targetId: row.targetId,
          field: row.field,
          text: row.proposed,
          userId: input.actor.id,
        });
      } else {
        void ModerationGateway.enqueueMediaUrl(input.traceReq, {
          businessLine,
          targetType: row.targetType as ModerationTargetType,
          targetId: row.targetId,
          field: row.field,
          contentType: 'image',
          mediaUrl: row.proposed,
          userId: input.actor.id,
        });
      }
    }

    return { ok: true };
  }
}

