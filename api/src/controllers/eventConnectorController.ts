/**
 * Event Connector Controller
 *
 * 暴露事件卡六向连接器的批量查询接口。
 *
 * 端点：GET /api/events/connectors?ids=uuid1,uuid2,...
 *
 * 设计要点：
 * - 独立路径，不侵入现有 /api/events/:id 等语义
 * - flag 关闭时返回 503 + FEATURE_DISABLED 错误码（前端可据此降级）
 * - 公开访问（与 storyEventController 的 GET 一致），但若有 user 则供 flag 灰度分桶
 */

import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/http';
import { getEventConnectorsRequest, getBranchComparisonRequest } from '../utils/validation';
import { FeatureFlagService } from '../domains/featureFlags/FeatureFlagService';
import { EventConnectorService } from '../domains/eventConnector/EventConnectorService';
import { EventConnectorRepo } from '../domains/eventConnector/EventConnectorRepo';

export const getEventConnectors = catchAsync(async (req: AuthRequest, res: Response) => {
  // flag 守护：未开启时拒绝服务，前端 fallback 到旧事件渲染
  const userId = req.user?.id;
  if (!FeatureFlagService.isEnabled('event_connectors', userId)) {
    throw new AppError(503, 'FEATURE_DISABLED', '事件连接器功能未启用');
  }

  // 校验 ?ids=uuid1,uuid2 → 解析为 string[]
  const parsed = getEventConnectorsRequest.parse({ query: req.query });
  const eventIds = parsed.query.ids;

  const cards = await EventConnectorService.getEventCards(eventIds);

  res.json({
    success: true,
    data: { items: cards, total: cards.length },
  });
});

/**
 * Phase 4：分支对比
 * GET /api/events/:eventId/branches/compare
 *
 * 返回主线轨道 + 各分支轨道（含前 3 章 preview + 统计）。
 * 同样受 event_connectors flag 守护。
 */
export const getBranchComparison = catchAsync(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!FeatureFlagService.isEnabled('event_connectors', userId)) {
    throw new AppError(503, 'FEATURE_DISABLED', '事件连接器功能未启用');
  }

  const parsed = getBranchComparisonRequest.parse({ params: req.params });
  const comparison = await EventConnectorRepo.getBranchComparison(parsed.params.eventId);
  if (!comparison) {
    throw new AppError(404, 'NOT_FOUND', '事件不存在或无主线故事');
  }

  res.json({
    success: true,
    data: { eventId: parsed.params.eventId, ...comparison },
  });
});
