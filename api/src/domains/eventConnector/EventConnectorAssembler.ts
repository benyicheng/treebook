/**
 * Event Connector Assembler
 *
 * 把 Repo 返回的 6 路 Map<eventId, summary> + 事件本体 + 节点索引
 * 合并成最终的 EventCardDTO[]。
 *
 * 纯函数、无 IO、无副作用 —— 便于单元测试。
 */

import type {
  EventCardDTO,
  EventConnectors,
  ChapterPreview,
  CharacterPreview,
  WikiPreview,
  BranchPreview,
  SpinoffPreview,
  ReadingPathPreview,
} from './types';
import type { EventNodeIndex } from './EventConnectorRepo';

type SummaryMap<T> = Map<string, { count: number; preview: T[] }>;

export interface AssemblerInput {
  /** 事件本体（已按 sortOrder 排序） */
  events: {
    id: string;
    storyId: string;
    title: string;
    description: string | null;
    sortOrder: number;
    type: string;
    importance: number;
    color: string | null;
  }[];
  /** 事件节点索引（用于判定 isBranchPoint） */
  nodeIndex: EventNodeIndex;
  chapters: SummaryMap<ChapterPreview>;
  characters: SummaryMap<CharacterPreview>;
  wiki: SummaryMap<WikiPreview>;
  branches: SummaryMap<BranchPreview>;
  spinoffs: SummaryMap<SpinoffPreview>;
  readingPaths: SummaryMap<ReadingPathPreview>;
}

export class EventConnectorAssembler {
  /**
   * 合并所有输入为 EventCardDTO[]。
   * 对每个事件：取 6 路 summary（缺失则填空），标记 isBranchPoint。
   */
  static assemble(input: AssemblerInput): EventCardDTO[] {
    const {
      events,
      nodeIndex,
      chapters,
      characters,
      wiki,
      branches,
      spinoffs,
      readingPaths,
    } = input;

    return events.map((e) => {
      const connectors: EventConnectors = {
        chapters: this.readOrDefault<ChapterPreview>(chapters, e.id),
        characters: this.readOrDefault<CharacterPreview>(characters, e.id),
        wiki: this.readOrDefault<WikiPreview>(wiki, e.id),
        branches: this.readOrDefault<BranchPreview>(branches, e.id),
        spinoffs: this.readOrDefault<SpinoffPreview>(spinoffs, e.id),
        readingPaths: this.readOrDefault<ReadingPathPreview>(readingPaths, e.id),
      };

      // isBranchPoint：事件含 branch 类型节点
      const isBranchPoint = (nodeIndex.branchTargetIds.get(e.id)?.length ?? 0) > 0;

      return {
        id: e.id,
        storyId: e.storyId,
        title: e.title,
        description: e.description,
        sortOrder: e.sortOrder,
        type: e.type,
        importance: e.importance,
        color: e.color,
        isBranchPoint,
        connectors,
      };
    });
  }

  /** 安全读取某事件的连接器摘要，缺失则返回空。 */
  private static readOrDefault<T>(map: SummaryMap<T>, eventId: string): { count: number; preview: T[] } {
    return map.get(eventId) ?? { count: 0, preview: [] };
  }
}
