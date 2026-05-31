import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { MergeService } from '../services/MergeService';
import { NotificationService } from '../services/NotificationService';
import { prisma } from '../prisma';
import { AppError } from '../utils/http';

export const createMergeRequest = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const mergeRequest = await MergeService.createMergeRequest(userId, req.body);

  // 通知故事原作者：有人发起了合并请求
  try {
    const story = await prisma.story.findUnique({
      where: { id: mergeRequest.storyId },
      select: { authorId: true, title: true },
    });
    if (story && story.authorId !== userId) {
      const { branchId, spinoffId, type } = mergeRequest;
      const targetLabel = type === 'branch_merge' ? '分支合并' : '番外认证';
      await NotificationService.createNotification({
        userId: story.authorId,
        actorId: userId,
        type: 'merge_requested',
        targetType: 'merge_request',
        targetId: mergeRequest.id,
        message: `有人对你的故事「${story.title}」发起了${targetLabel}请求`,
      });
    }
  } catch (err) {
    console.error('Failed to create merge request notification:', err);
  }

  res.status(201).json({ success: true, data: mergeRequest });
});

export const getMergeRequests = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const requests = await MergeService.getMergeRequests(req.params.storyId, userId);
  res.json({ success: true, data: requests });
});

export const previewMerge = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const preview = await MergeService.previewMerge(req.params.requestId);
  res.json({ success: true, data: preview });
});

export const handleMergeRequest = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'UNAUTHORIZED', 'Unauthorized');

  const result = await MergeService.handleMergeRequest(req.params.requestId, userId, req.body);

  // 通知请求发起者：你的合并请求已被处理
  try {
    const mergeRequest = await prisma.mergeRequest.findUnique({
      where: { id: req.params.requestId },
      include: {
        story: { select: { title: true } },
        branch: { select: { title: true, authorId: true } },
        spinoff: { select: { title: true, authorId: true } },
      },
    });

    if (mergeRequest) {
      const requesterId =
        mergeRequest.branch?.authorId || mergeRequest.spinoff?.authorId;
      const targetTitle =
        mergeRequest.branch?.title || mergeRequest.spinoff?.title || '未知';
      const isApproved = req.body.status === 'approved';
      const typeLabel = mergeRequest.type === 'branch_merge' ? '分支' : '番外';

      if (requesterId && requesterId !== userId) {
        await NotificationService.createNotification({
          userId: requesterId,
          actorId: userId,
          type: isApproved ? 'merge_approved' : 'merge_rejected',
          targetType: 'merge_request',
          targetId: mergeRequest.id,
          message: isApproved
            ? `你的${typeLabel}「${targetTitle}」已被故事「${mergeRequest.story.title}」原作者通过`
            : `你的${typeLabel}「${targetTitle}」合并到「${mergeRequest.story.title}」的请求已被拒绝`,
        });
      }
    }
  } catch (err) {
    console.error('Failed to create merge result notification:', err);
  }

  res.json({ success: true, data: result });
});
