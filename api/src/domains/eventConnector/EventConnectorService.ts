/**
 * Event Connector Service
 *
 * 编排层：并发执行 6 路 Repo query，交给 Assembler 合并。
 *
 * flag 守护：FeatureFlagService.isEnabled('event_connectors') 关闭时，
 * 调用方应走旧逻辑（不调用本 Service）。本 Service 假定 flag 已开。
 */

import { EventConnectorRepo } from './EventConnectorRepo';
import { EventConnectorAssembler } from './EventConnectorAssembler';
import type { EventCardDTO } from './types';

export class EventConnectorService {
  /**
   * 给定一批 eventIds，返回带六向连接器的 EventCardDTO[]。
   *
   * 执行顺序：
   * 1. nodeIndex（其他连接器的基础，必须先拿）
   * 2. 6 路并发（chapters/characters/wiki/branches/spinoffs/readingPaths）
   * 3. Assembler 合并
   *
   * 性能：nodeIndex 1 趟 + 6 路并发 1 趟 = 2 趟 RTT。
   */
  static async getEventCards(eventIds: string[]): Promise<EventCardDTO[]> {
    if (eventIds.length === 0) return [];

    // 1. 节点索引（其他连接器的 fallback 基础）
    const nodeIndex = await EventConnectorRepo.getEventNodeIndex(eventIds);

    // 2. 事件本体 + 5 路依赖 nodeIndex 的连接器 + 1 路直接查的路径，全部并发
    const [events, chapters, characters, wiki, branches, spinoffs, readingPaths] =
      await Promise.all([
        EventConnectorRepo.getEvents(eventIds),
        EventConnectorRepo.getChapterConnectors(nodeIndex),
        EventConnectorRepo.getCharacterConnectors(nodeIndex),
        EventConnectorRepo.getWikiConnectors(eventIds),
        EventConnectorRepo.getBranchConnectors(nodeIndex),
        EventConnectorRepo.getSpinoffConnectors(nodeIndex),
        EventConnectorRepo.getReadingPathConnectors(eventIds),
      ]);

    // 3. 合并
    return EventConnectorAssembler.assemble({
      events,
      nodeIndex,
      chapters,
      characters,
      wiki,
      branches,
      spinoffs,
      readingPaths,
    });
  }
}
