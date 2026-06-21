import { describe, it, expect } from 'vitest';
import { EventConnectorAssembler } from '../EventConnectorAssembler';
import type { AssemblerInput } from '../EventConnectorAssembler';
import type { EventNodeIndex } from '../EventConnectorRepo';

/**
 * Assembler 是纯函数：给定 6 路 Map + 事件本体 + 节点索引，输出 EventCardDTO[]。
 * 测试覆盖：
 * - 空输入 / 部分缺失 / 全空
 * - isBranchPoint 判定（branch 类型节点存在与否）
 * - 字段透传完整性
 * - 多事件并存且各自连接器互不串扰
 */

const emptyNodeIndex = (): EventNodeIndex => ({
  chapterTargetIds: new Map(),
  branchTargetIds: new Map(),
  spinoffTargetIds: new Map(),
});

/** 构造一个最小化的合法 AssemblerInput */
const makeInput = (overrides: Partial<AssemblerInput> = {}): AssemblerInput => ({
  events: [],
  nodeIndex: emptyNodeIndex(),
  chapters: new Map(),
  characters: new Map(),
  wiki: new Map(),
  branches: new Map(),
  spinoffs: new Map(),
  readingPaths: new Map(),
  ...overrides,
});

describe('EventConnectorAssembler', () => {
  it('空 events 输入返回空数组', () => {
    const result = EventConnectorAssembler.assemble(makeInput());
    expect(result).toEqual([]);
  });

  it('单事件 + 全空连接器 → 6 格都是 {count:0, preview:[]}', () => {
    const result = EventConnectorAssembler.assemble(
      makeInput({
        events: [
          {
            id: 'evt-1',
            storyId: 'sty-1',
            title: '雨夜码头',
            description: null,
            sortOrder: 0,
            type: 'main_arc',
            importance: 1,
            color: null,
          },
        ],
      }),
    );
    expect(result).toHaveLength(1);
    const card = result[0];
    expect(card.id).toBe('evt-1');
    expect(card.connectors.chapters).toEqual({ count: 0, preview: [] });
    expect(card.connectors.characters).toEqual({ count: 0, preview: [] });
    expect(card.connectors.wiki).toEqual({ count: 0, preview: [] });
    expect(card.connectors.branches).toEqual({ count: 0, preview: [] });
    expect(card.connectors.spinoffs).toEqual({ count: 0, preview: [] });
    expect(card.connectors.readingPaths).toEqual({ count: 0, preview: [] });
    expect(card.isBranchPoint).toBe(false);
  });

  it('事件含 branch 类型节点 → isBranchPoint=true', () => {
    const nodeIndex = emptyNodeIndex();
    nodeIndex.branchTargetIds.set('evt-1', ['br-a', 'br-b']);

    const result = EventConnectorAssembler.assemble(
      makeInput({
        events: [
          {
            id: 'evt-1',
            storyId: 'sty-1',
            title: 'X',
            description: null,
            sortOrder: 0,
            type: 'main_arc',
            importance: 1,
            color: null,
          },
        ],
        nodeIndex,
      }),
    );
    expect(result[0].isBranchPoint).toBe(true);
  });

  it('事件无 branch 节点（仅 chapter / spinoff）→ isBranchPoint=false', () => {
    const nodeIndex = emptyNodeIndex();
    nodeIndex.chapterTargetIds.set('evt-1', ['chp-1']);
    nodeIndex.spinoffTargetIds.set('evt-1', ['sp-1']);

    const result = EventConnectorAssembler.assemble(
      makeInput({
        events: [
          {
            id: 'evt-1',
            storyId: 'sty-1',
            title: 'X',
            description: null,
            sortOrder: 0,
            type: 'main_arc',
            importance: 1,
            color: null,
          },
        ],
        nodeIndex,
      }),
    );
    expect(result[0].isBranchPoint).toBe(false);
  });

  it('多事件并存：各自连接器互不串扰', () => {
    const chapters = new Map();
    chapters.set('evt-1', {
      count: 2,
      preview: [
        { id: 'chp-1', title: '第一章', orderIndex: 0, storyId: 'sty-1', branchId: null },
        { id: 'chp-2', title: '第二章', orderIndex: 1, storyId: 'sty-1', branchId: null },
      ],
    });
    chapters.set('evt-2', {
      count: 1,
      preview: [
        { id: 'chp-9', title: '第九章', orderIndex: 8, storyId: 'sty-1', branchId: null },
      ],
    });

    const result = EventConnectorAssembler.assemble(
      makeInput({
        events: [
          {
            id: 'evt-1',
            storyId: 'sty-1',
            title: 'A',
            description: null,
            sortOrder: 0,
            type: 'main_arc',
            importance: 1,
            color: null,
          },
          {
            id: 'evt-2',
            storyId: 'sty-1',
            title: 'B',
            description: null,
            sortOrder: 1,
            type: 'main_arc',
            importance: 1,
            color: null,
          },
        ],
        chapters,
      }),
    );

    expect(result[0].connectors.chapters.count).toBe(2);
    expect(result[0].connectors.chapters.preview).toHaveLength(2);
    expect(result[1].connectors.chapters.count).toBe(1);
    expect(result[1].connectors.chapters.preview[0].id).toBe('chp-9');
  });

  it('连接器 Map 中无对应 eventId → 该连接器返回空摘要（不抛错）', () => {
    // 仅 evt-1 有 chapters 数据，evt-2 在 chapters Map 中缺失
    const chapters = new Map();
    chapters.set('evt-1', {
      count: 1,
      preview: [
        { id: 'chp-1', title: '一', orderIndex: 0, storyId: 'sty-1', branchId: null },
      ],
    });

    const result = EventConnectorAssembler.assemble(
      makeInput({
        events: [
          {
            id: 'evt-1',
            storyId: 'sty-1',
            title: 'A',
            description: null,
            sortOrder: 0,
            type: 'main_arc',
            importance: 1,
            color: null,
          },
          {
            id: 'evt-2',
            storyId: 'sty-1',
            title: 'B',
            description: null,
            sortOrder: 1,
            type: 'main_arc',
            importance: 1,
            color: null,
          },
        ],
        chapters,
      }),
    );

    expect(result[0].connectors.chapters.count).toBe(1);
    expect(result[1].connectors.chapters).toEqual({ count: 0, preview: [] });
  });

  it('字段完整透传：title/description/color/type/importance/sortOrder', () => {
    const result = EventConnectorAssembler.assemble(
      makeInput({
        events: [
          {
            id: 'evt-1',
            storyId: 'sty-1',
            title: '雨夜码头·初遇',
            description: '主角在暴雨中目睹 X 的出现…',
            sortOrder: 5,
            type: 'turning_point',
            importance: 5,
            color: '#ff5722',
          },
        ],
      }),
    );
    expect(result[0]).toMatchObject({
      id: 'evt-1',
      storyId: 'sty-1',
      title: '雨夜码头·初遇',
      description: '主角在暴雨中目睹 X 的出现…',
      sortOrder: 5,
      type: 'turning_point',
      importance: 5,
      color: '#ff5722',
    });
  });

  it('events 输入顺序保持（不重排）', () => {
    const result = EventConnectorAssembler.assemble(
      makeInput({
        events: [
          {
            id: 'evt-z',
            storyId: 'sty-1',
            title: 'Z',
            description: null,
            sortOrder: 99,
            type: 'main_arc',
            importance: 1,
            color: null,
          },
          {
            id: 'evt-a',
            storyId: 'sty-1',
            title: 'A',
            description: null,
            sortOrder: 1,
            type: 'main_arc',
            importance: 1,
            color: null,
          },
        ],
      }),
    );
    // Assembler 保持输入顺序（排序应由调用方负责）
    expect(result.map((c) => c.id)).toEqual(['evt-z', 'evt-a']);
  });
});
