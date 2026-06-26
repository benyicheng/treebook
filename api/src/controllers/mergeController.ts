import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { MergeService } from '../services/MergeService';
import { prisma } from '../prisma';
import { getCurrentUser } from '../utils/authHelpers';
import { notifyStoryAuthor, notifyUser } from '../utils/notifications';

export const createMergeRequest = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const mergeRequest = await MergeService.createMergeRequest(userId, req.body);

  // 通知故事原作者：有人发起了合并请求
  const targetLabel = mergeRequest.type === 'branch_merge' ? '分支合并' : '番外认证';
  await notifyStoryAuthor(
    mergeRequest.storyId,
    userId,
    'merge_requested',
    'merge_request',
    mergeRequest.id,
    (title) => `有人对你的故事「${title}」发起了${targetLabel}请求`,
  );

  res.status(201).json({ success: true, data: mergeRequest });
});

export const getMergeRequests = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const requests = await MergeService.getMergeRequests(req.params.storyId, userId);
  res.json({ success: true, data: requests });
});

export const previewMerge = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const preview = await MergeService.previewMerge(req.params.requestId);
  res.json({ success: true, data: preview });
});

export const handleMergeRequest = catchAsync(async (req: AuthRequest, res: Response) => {
  const { id: userId } = getCurrentUser(req);

  const result = await MergeService.handleMergeRequest(req.params.requestId, userId, req.body);

  // 通知请求发起者：你的合并请求已被处理
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

    if (requesterId) {
      await notifyUser(
        requesterId,
        userId,
        isApproved ? 'merge_approved' : 'merge_rejected',
        'merge_request',
        mergeRequest.id,
        isApproved
          ? `你的${typeLabel}「${targetTitle}」已被故事「${mergeRequest.story.title}」原作者通过`
          : `你的${typeLabel}「${targetTitle}」合并到「${mergeRequest.story.title}」的请求已被拒绝`,
      );
    }
  }

  res.json({ success: true, data: result });
});
