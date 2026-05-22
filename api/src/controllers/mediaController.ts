import type { Response } from 'express';
import fs from 'fs';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/http';
import type { AuthRequest } from '../middleware/auth';
import { MediaService } from '../domains/media/MediaService';
import { MediaRepository } from '../domains/media/MediaRepository';
import { MediaStorageService } from '../domains/media/MediaStorageService';
import { ModerationGateway } from '../domains/moderation/ModerationGateway';

export const uploadMedia = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id || null;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const f: any = (req as any).file;
  if (!f?.buffer || !f?.originalname || !f?.mimetype) throw new AppError(400, 'BAD_REQUEST', '缺少上传文件');

  const purpose = typeof (req as any).body?.purpose === 'string' ? (req as any).body.purpose : null;
  const out = await MediaService.upload({
    ownerUserId: userId,
    purpose,
    buffer: f.buffer as Buffer,
    originalName: f.originalname as string,
    mimeType: f.mimetype as string,
  });

  void ModerationGateway.enqueueMediaUrl(req as any, {
    businessLine: 'media',
    targetType: 'media_asset',
    targetId: out.assetId,
    field: 'file',
    contentType: out.kind,
    mediaUrl: out.storagePath,
    userId,
  } as any);

  res.status(201).json({
    success: true,
    data: {
      id: out.assetId,
      kind: out.kind,
      mimeType: out.mimeType,
      sizeBytes: out.sizeBytes,
      url: `/api/media/assets/${out.assetId}`,
      status: 'quarantined',
    },
  });
});

export const getMediaAsset = catchAsync(async (req: AuthRequest, res: Response) => {
  const asset = await MediaRepository.getAssetById(req.params.id);
  if (!asset) throw new AppError(404, 'NOT_FOUND', 'Asset not found');

  const isOwner = !!req.user?.id && req.user.id === asset.ownerUserId;
  const isAdmin = req.user?.role === 'admin';
  const canView = asset.status === 'approved' || isOwner || isAdmin;
  if (!canView) throw new AppError(404, 'NOT_FOUND', 'Asset not found');

  const abs = await MediaStorageService.readAbsolute(asset.storagePath);
  res.setHeader('content-type', asset.mimeType);
  const stream = fs.createReadStream(abs);
  stream.on('error', () => {
    res.status(404).end();
  });
  stream.pipe(res);
});

