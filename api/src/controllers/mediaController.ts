import type { Response } from 'express';
import fs from 'fs';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/http';
import { getCurrentUser } from '../utils/authHelpers';
import type { AuthRequest } from '../middleware/auth';
import { MediaService } from '../domains/media/MediaService';
import { MediaRepository } from '../domains/media/MediaRepository';
import { MediaStorageService } from '../domains/media/MediaStorageService';
import { ModerationGateway } from '../domains/moderation/ModerationGateway';

interface MulterRequest extends Omit<AuthRequest, 'file'> {
  file?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
  };
  body: Record<string, unknown>;
}

export const uploadMedia = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);
  const mReq = req as MulterRequest;

  const f = mReq.file;
  if (!f?.buffer || !f?.originalname || !f?.mimetype) throw new AppError(400, 'BAD_REQUEST', '缺少上传文件');

  const purpose = typeof mReq.body?.purpose === 'string' ? (mReq.body.purpose as string) : null;
  const out = await MediaService.upload({
    ownerUserId: userId,
    purpose,
    buffer: f.buffer,
    originalName: f.originalname,
    mimeType: f.mimetype,
  });

  void ModerationGateway.enqueueMediaUrl(req, {
    businessLine: 'media',
    targetType: 'media_asset',
    targetId: out.assetId,
    field: 'file',
    contentType: out.kind,
    mediaUrl: out.storagePath,
    userId,
  } as Parameters<typeof ModerationGateway.enqueueMediaUrl>[1]);

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

