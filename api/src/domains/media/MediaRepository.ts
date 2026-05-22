import crypto from 'crypto';
import { prisma } from '../../prisma';
import type { MediaAssetRow, MediaAssetStatus } from './types';

export class MediaRepository {
  static async createAsset(input: {
    ownerUserId: string | null;
    purpose?: string | null;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    sha256: string;
    storageProvider: string;
    storagePath: string;
    status: MediaAssetStatus;
    width?: number | null;
    height?: number | null;
    durationMs?: number | null;
  }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await prisma.$executeRaw`
      INSERT INTO "media_assets" (
        "id","ownerUserId","purpose","originalName","mimeType","sizeBytes","sha256","storageProvider","storagePath","status","width","height","durationMs","createdAt","updatedAt"
      ) VALUES (
        ${id},
        ${input.ownerUserId},
        ${input.purpose || null},
        ${input.originalName},
        ${input.mimeType},
        ${input.sizeBytes},
        ${input.sha256},
        ${input.storageProvider},
        ${input.storagePath},
        ${input.status},
        ${input.width ?? null},
        ${input.height ?? null},
        ${input.durationMs ?? null},
        ${now},
        ${now}
      )
    `;
    return id;
  }

  static async getAssetById(id: string): Promise<MediaAssetRow | null> {
    const rows = (await prisma.$queryRaw`
      SELECT "id","ownerUserId","purpose","originalName","mimeType","sizeBytes","sha256","storageProvider","storagePath","status","width","height","durationMs","createdAt","updatedAt"
      FROM "media_assets"
      WHERE "id" = ${id}
      LIMIT 1
    `) as any[];
    return (rows[0] as any) || null;
  }

  static async setAssetStatus(id: string, status: MediaAssetStatus) {
    const now = new Date().toISOString();
    await prisma.$executeRaw`
      UPDATE "media_assets"
      SET "status" = ${status}, "updatedAt" = ${now}
      WHERE "id" = ${id}
    `;
  }

  static async addRiskLog(input: {
    assetId: string | null;
    kind: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    payload?: unknown;
  }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const payload = input.payload === undefined ? null : JSON.stringify(input.payload);
    await prisma.$executeRaw`
      INSERT INTO "media_risk_logs" ("id","assetId","kind","severity","message","payload","createdAt")
      VALUES (${id}, ${input.assetId}, ${input.kind}, ${input.severity}, ${input.message}, ${payload}, ${now})
    `;
    return id;
  }
}
