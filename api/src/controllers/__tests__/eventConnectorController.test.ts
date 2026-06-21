import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth';

/**
 * Controller 级测试：核心是验证 flag 守护逻辑（零回归保证）。
 *
 * 策略：mock EventConnectorService 与 FeatureFlagService，避免触达数据库。
 * 这里只测 controller 的"指挥逻辑"：flag off → 503，flag on → 调用 service 并响应。
 */

// 必须在 import controller 之前 mock，否则 controller 拿到的是真实模块
vi.mock('../../domains/featureFlags/FeatureFlagService', () => ({
  FeatureFlagService: {
    isEnabled: vi.fn(),
  },
}));
vi.mock('../../domains/eventConnector/EventConnectorService', () => ({
  EventConnectorService: {
    getEventCards: vi.fn(),
  },
}));

import { FeatureFlagService } from '../../domains/featureFlags/FeatureFlagService';
import { EventConnectorService } from '../../domains/eventConnector/EventConnectorService';
import { getEventConnectors } from '../eventConnectorController';

const mockedIsEnabled = vi.mocked(FeatureFlagService.isEnabled);
const mockedGetEventCards = vi.mocked(EventConnectorService.getEventCards);

/** 构造一个最小 Express 三件套 */
const makeReqRes = (query: Record<string, unknown> = {}, user?: AuthRequest['user']) => {
  const req = { query, user } as unknown as AuthRequest;
  const res = {
    statusCode: 200,
    json: vi.fn().mockReturnThis(),
    status: vi.fn(function (this: Response, code: number) {
      (this as { statusCode: number }).statusCode = code;
      return this;
    }),
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next };
};

describe('eventConnectorController.getEventConnectors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('flag 关闭 → next 收到 503 FEATURE_DISABLED 错误', async () => {
    mockedIsEnabled.mockReturnValue(false);

    const { req, res, next } = makeReqRes({ ids: 'a09c8d4c-1234-4cda-9abc-123456789abc' });
    await (getEventConnectors as unknown as (
      req: AuthRequest,
      res: Response,
      next: NextFunction,
    ) => Promise<void>)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = (next as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0] as {
      statusCode?: number;
      code?: string;
    };
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe('FEATURE_DISABLED');
    expect(mockedGetEventCards).not.toHaveBeenCalled();
  });

  it('flag 开启 → 调用 Service 并响应 success', async () => {
    mockedIsEnabled.mockReturnValue(true);
    mockedGetEventCards.mockResolvedValue([
      {
        id: 'a09c8d4c-1234-4cda-9abc-123456789abc',
        storyId: 'sty-1',
        title: 'X',
        description: null,
        sortOrder: 0,
        type: 'main_arc',
        importance: 1,
        color: null,
        isBranchPoint: false,
        connectors: {
          chapters: { count: 0, preview: [] },
          characters: { count: 0, preview: [] },
          wiki: { count: 0, preview: [] },
          branches: { count: 0, preview: [] },
          spinoffs: { count: 0, preview: [] },
          readingPaths: { count: 0, preview: [] },
        },
      },
    ]);

    const { req, res, next } = makeReqRes(
      { ids: 'a09c8d4c-1234-4cda-9abc-123456789abc' },
      { id: 'user-1', email: 'u@x.com', role: 'user' },
    );
    await (getEventConnectors as unknown as (
      req: AuthRequest,
      res: Response,
      next: NextFunction,
    ) => Promise<void>)(req, res, next);

    expect(mockedIsEnabled).toHaveBeenCalledWith('event_connectors', 'user-1');
    expect(mockedGetEventCards).toHaveBeenCalledWith(['a09c8d4c-1234-4cda-9abc-123456789abc']);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ total: 1 }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('ids 缺失 → next 收到 ZodError（400 由 errorHandler 转）', async () => {
    mockedIsEnabled.mockReturnValue(true);

    const { req, res, next } = makeReqRes({});
    await (getEventConnectors as unknown as (
      req: AuthRequest,
      res: Response,
      next: NextFunction,
    ) => Promise<void>)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockedGetEventCards).not.toHaveBeenCalled();
  });

  it('ids 超过 50 个 → next 收到 ZodError', async () => {
    mockedIsEnabled.mockReturnValue(true);
    const tooMany = Array.from({ length: 51 }, () =>
      'a09c8d4c-1234-4cda-9abc-123456789abc',
    ).join(',');

    const { req, res, next } = makeReqRes({ ids: tooMany });
    await (getEventConnectors as unknown as (
      req: AuthRequest,
      res: Response,
      next: NextFunction,
    ) => Promise<void>)(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockedGetEventCards).not.toHaveBeenCalled();
  });

  it('未登录用户（无 user）也调用 isEnabled，但 userId 为 undefined', async () => {
    mockedIsEnabled.mockReturnValue(true);
    mockedGetEventCards.mockResolvedValue([]);

    const { req, res, next } = makeReqRes({ ids: 'a09c8d4c-1234-4cda-9abc-123456789abc' });
    await (getEventConnectors as unknown as (
      req: AuthRequest,
      res: Response,
      next: NextFunction,
    ) => Promise<void>)(req, res, next);

    expect(mockedIsEnabled).toHaveBeenCalledWith('event_connectors', undefined);
    expect(next).not.toHaveBeenCalled();
  });
});
