import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { AIGenerationService } from '../services/AIGenerationService';
import { AppError } from '../utils/http';
import { ModerationGateway } from '../domains/moderation/ModerationGateway';

/**
 * AI 角色/场景生图
 */
export const generateImage = catchAsync(async (req: AuthRequest, res: Response) => {
  const { prompt, options } = req.body;

  if (!prompt) {
    throw new AppError(400, 'BAD_REQUEST', 'Prompt is required');
  }

  // 调用之前创建的 AI 服务
  const result = await AIGenerationService.generateImage(prompt, options);
  const userId = req.user?.id;
  void ModerationGateway.enqueueText(req, {
    businessLine: 'ai',
    targetType: 'ai_asset',
    targetId: result.imageUrl,
    field: 'prompt',
    text: String(prompt),
    userId,
  });
  if (result.imageUrl) {
    void ModerationGateway.enqueueMediaUrl(req, {
      businessLine: 'ai',
      targetType: 'ai_asset',
      targetId: result.imageUrl,
      field: 'imageUrl',
      contentType: 'image',
      mediaUrl: result.imageUrl,
      userId,
    });
  }
  
  res.json({
    success: true,
    data: result
  });
});

/**
 * AI 视频番外预览生成 (演示)
 */
export const generateVideo = catchAsync(async (req: AuthRequest, res: Response) => {
  const { prompt, options } = req.body;

  if (!prompt) {
    throw new AppError(400, 'BAD_REQUEST', 'Prompt is required');
  }

  const result = await AIGenerationService.generateVideo(prompt, options);
  const userId = req.user?.id;
  void ModerationGateway.enqueueText(req, {
    businessLine: 'ai',
    targetType: 'ai_asset',
    targetId: result.videoUrl,
    field: 'prompt',
    text: String(prompt),
    userId,
  });
  if (result.videoUrl) {
    void ModerationGateway.enqueueMediaUrl(req, {
      businessLine: 'ai',
      targetType: 'ai_asset',
      targetId: result.videoUrl,
      field: 'videoUrl',
      contentType: 'video',
      mediaUrl: result.videoUrl,
      userId,
    });
  }
  
  res.json({
    success: true,
    data: result
  });
});
