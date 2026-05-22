import crypto from 'crypto';
import { AppError } from '../../utils/http';
import { MediaConfigService } from './MediaConfigService';
import { getVirusScanner } from './getVirusScanner';
import { MediaRepository } from './MediaRepository';
import { MediaStorageService } from './MediaStorageService';
import type { MediaKind } from './types';
import { tripMediaDegrade } from './degrade';

const getKind = (mimeType: string): MediaKind | null => {
  if (mimeType === 'image/png' || mimeType === 'image/jpeg' || mimeType === 'image/webp') return 'image';
  if (mimeType === 'audio/mpeg' || mimeType === 'audio/wav') return 'audio';
  if (mimeType === 'video/mp4') return 'video';
  return null;
};

const sha256 = (buf: Buffer) => crypto.createHash('sha256').update(buf).digest('hex');

const inRollout = (userId: string | null, percent: number) => {
  if (percent >= 100) return true;
  if (!userId) return false;
  const h = crypto.createHash('sha1').update(userId).digest();
  const n = h.readUInt32BE(0);
  return (n % 100) < Math.max(0, Math.min(100, percent));
};

export class MediaService {
  static async upload(input: {
    ownerUserId: string | null;
    purpose?: string | null;
    buffer: Buffer;
    originalName: string;
    mimeType: string;
  }) {
    try {
      const cfg = MediaConfigService.getConfig();
      if (!cfg.enabled) throw new AppError(503, 'MEDIA_UPLOADS_DISABLED', '媒体上传暂不可用');
      if (!inRollout(input.ownerUserId, cfg.rolloutPercent)) throw new AppError(503, 'MEDIA_NOT_IN_ROLLOUT', '媒体上传暂不可用');

      const kind = getKind(input.mimeType);
      if (!kind) throw new AppError(400, 'UNSUPPORTED_MEDIA_TYPE', '不支持的文件类型');

      const sizeBytes = input.buffer.length;
      const max =
        kind === 'image' ? cfg.maxImageBytes : kind === 'audio' ? cfg.maxAudioBytes : cfg.maxVideoBytes;
      if (sizeBytes > max) throw new AppError(413, 'FILE_TOO_LARGE', '文件过大');

      const scanner = getVirusScanner();
      const scan = await scanner.scan({ buffer: input.buffer, mimeType: input.mimeType, originalName: input.originalName });
      if (scan.ok === false) {
        const assetId = await MediaRepository.createAsset({
          ownerUserId: input.ownerUserId,
          purpose: input.purpose || null,
          originalName: input.originalName,
          mimeType: input.mimeType,
          sizeBytes,
          sha256: sha256(input.buffer),
          storageProvider: 'local',
          storagePath: '',
          status: 'failed_scan',
        });
        for (const t of scan.threats) {
          await MediaRepository.addRiskLog({
            assetId,
            kind: t.kind,
            severity: 'high',
            message: t.message,
          });
        }
        throw new AppError(400, 'UPLOAD_REJECTED', '文件未通过安全检测');
      }

      let outBuffer = input.buffer;
      let outMimeType = input.mimeType;
      let outName = input.originalName;

      if (kind === 'image' && (process.env.MEDIA_IMAGE_OPTIMIZE || '').toLowerCase() !== 'false') {
        try {
          const mod: any = await import('sharp');
          const sharp = mod?.default || mod;
          const img = sharp(outBuffer, { failOnError: false }).rotate();
          const meta = await img.metadata();
          if (meta.width && meta.height) {
            const maxSide = 2000;
            if (meta.width > maxSide || meta.height > maxSide) {
              img.resize({ width: maxSide, height: maxSide, fit: 'inside', withoutEnlargement: true });
            }
          }
          outBuffer = await img.webp({ quality: 80 }).toBuffer();
          outMimeType = 'image/webp';
          outName = outName.replace(/\.[^./\\]+$/, '') + '.webp';
        } catch {}
      }

      const hash = sha256(outBuffer);
      const saved = await MediaStorageService.saveToQuarantine({
        buffer: outBuffer,
        originalName: outName,
        quarantineDir: cfg.quarantineDir,
      });

      const assetId = await MediaRepository.createAsset({
        ownerUserId: input.ownerUserId,
        purpose: input.purpose || null,
        originalName: outName,
        mimeType: outMimeType,
        sizeBytes: outBuffer.length,
        sha256: hash,
        storageProvider: 'local',
        storagePath: saved.storagePath,
        status: 'quarantined',
      });

      return { assetId, kind, mimeType: outMimeType, sizeBytes: outBuffer.length, storagePath: saved.storagePath };
    } catch (e: any) {
      if (e instanceof AppError) throw e;
      tripMediaDegrade(30_000);
      throw new AppError(503, 'MEDIA_DEGRADED', '媒体服务暂不可用');
    }
  }
}
