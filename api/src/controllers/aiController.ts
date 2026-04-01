import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { AIGenerationService } from '../services/AIGenerationService';
import { AppError } from '../utils/http';

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
  
  res.json({
    success: true,
    data: result
  });
});
