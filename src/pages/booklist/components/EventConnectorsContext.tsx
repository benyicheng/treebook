/**
 * Event Connectors Context
 *
 * 批量预拉的核心：在 BooklistEventTab 顶部包一层 Provider，
 * 把所有事件 ID 一次性请求 /events/connectors，结果缓存在 context 里。
 * 子级 BooklistEventCard 用 useEventConnector(eventId) hook 拿数据。
 *
 * 这样做避免了 N 张卡片 × N 次请求的雪崩。
 *
 * Flag 守护：
 * - 前端 flag off → Provider 直接不发请求，hook 永远返回 null
 * - 后端 flag off（503）→ TanStack Query 抛错，hook 返回 null（降级到旧 UI）
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchEventConnectors,
  type EventCardDTO,
  type EventConnectors,
} from '../../../api/eventConnectorService';
import { isFrontendFlagEnabled } from '../../../lib/featureFlags';

interface EventConnectorsContextValue {
  /** flag 是否生效（前端 flag on + 后端未拒绝） */
  isActive: boolean;
  /** 是否仍在加载（仅 flag on 时有意义） */
  isLoading: boolean;
  /** eventId → connectors 映射；未命中或未启用时为 undefined */
  byId: Map<string, EventCardDTO>;
}

const EventConnectorsContext = createContext<EventConnectorsContextValue>({
  isActive: false,
  isLoading: false,
  byId: new Map(),
});

interface ProviderProps {
  /** 当前书单 event tab 中所有需要拉 connectors 的事件 ID */
  eventIds: string[];
  children: React.ReactNode;
}

/**
 * Provider：在事件 tab 顶部包一次，自动拉取所有事件的连接器摘要。
 * eventIds 为空 / flag off 时不发请求（与现状逐字节一致）。
 */
export const EventConnectorsProvider: React.FC<ProviderProps> = ({ eventIds, children }) => {
  const flagOn = isFrontendFlagEnabled('event_connectors');

  // 排序确保 query key 稳定（同一组 ids 不同顺序也命中同一缓存）
  const sortedIds = useMemo(() => [...eventIds].sort(), [eventIds]);

  const enabled = flagOn && sortedIds.length > 0;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['eventConnectors', sortedIds],
    queryFn: () => fetchEventConnectors(sortedIds),
    enabled,
    staleTime: 60_000, // 1 分钟新鲜
    gcTime: 5 * 60_000, // 5 分钟回收
    retry: false, // 失败就降级，不重试（503 FEATURE_DISABLED 不应重试）
  });

  const value = useMemo<EventConnectorsContextValue>(() => {
    const byId = new Map<string, EventCardDTO>();
    if (data?.items) {
      for (const item of data.items) byId.set(item.id, item);
    }
    return {
      // flag on 且未失败时才视为 active；失败时降级
      isActive: enabled && !isError,
      isLoading: enabled && isLoading,
      byId,
    };
  }, [data, isLoading, isError, enabled]);

  return (
    <EventConnectorsContext.Provider value={value}>{children}</EventConnectorsContext.Provider>
  );
};

/**
 * Hook：在 BooklistEventCard 中读取单个事件的连接器。
 *
 * 返回值约定：
 * - { active: false } —— flag off / 加载中 / 失败 → 调用方走旧 UI
 * - { active: true, connectors, isBranchPoint } —— flag on 且数据就绪 → 渲染六向连接器
 */
export function useEventConnector(eventId: string):
  | { active: false }
  | { active: true; connectors: EventConnectors; isBranchPoint: boolean } {
  const ctx = useContext(EventConnectorsContext);
  if (!ctx.isActive) return { active: false };
  const card = ctx.byId.get(eventId);
  if (!card) return { active: false };
  return { active: true, connectors: card.connectors, isBranchPoint: card.isBranchPoint };
}

/** 测试 / 调试：暴露 context 状态（不直接给业务代码用） */
export function useEventConnectorsState() {
  return useContext(EventConnectorsContext);
}
