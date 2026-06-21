/**
 * Phase 4 零回归 + 入口渲染测试
 *
 * 验证：
 * 1. InlineGrid 在 branches 连接器下渲染"对比预览"按钮（仅当传入 onCompareBranches）
 * 2. 点击按钮触发 onCompareBranches 回调，传出 eventId + eventTitle
 * 3. 未传 onCompareBranches 时不渲染按钮（向后兼容）
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EventConnectorInlineGrid from '../EventConnectorInlineGrid';
import type { EventConnectors } from '../../../../api/eventConnectorService';

vi.mock('../../../../stores/useNavigationStackStore', () => ({
  useNavigationStackStore: () => ({ openDrawer: vi.fn() }),
}));

const makeConnectors = (overrides: Partial<EventConnectors> = {}): EventConnectors => ({
  chapters: { count: 0, preview: [] },
  characters: { count: 0, preview: [] },
  wiki: { count: 0, preview: [] },
  branches: { count: 0, preview: [] },
  spinoffs: { count: 0, preview: [] },
  readingPaths: { count: 0, preview: [] },
  ...overrides,
});

const branchConnectors = makeConnectors({
  branches: {
    count: 2,
    preview: [
      { id: 'br-1', title: '上前搭话', branchType: 'alternative', chapterCount: 3 },
      { id: 'br-2', title: '暗中跟踪', branchType: 'alternative', chapterCount: 2 },
    ],
  },
});

const renderGrid = (props: Partial<Parameters<typeof EventConnectorInlineGrid>[0]> = {}) =>
  render(
    <MemoryRouter>
      <EventConnectorInlineGrid
        connectors={branchConnectors}
        activeKey="branches"
        eventId="evt-1"
        eventTitle="雨夜码头"
        {...props}
      />
    </MemoryRouter>,
  );

describe('EventConnectorInlineGrid · 分支对比入口', () => {
  it('branches 连接器下渲染分支列表 + "对比预览" 按钮', () => {
    renderGrid({ onCompareBranches: vi.fn() });
    expect(screen.getByText('上前搭话')).toBeInTheDocument();
    expect(screen.getByText('暗中跟踪')).toBeInTheDocument();
    expect(screen.getByText(/对比预览/)).toBeInTheDocument();
  });

  it('点击"对比预览" → onCompareBranches 收到 eventId + eventTitle', () => {
    const onCompare = vi.fn();
    renderGrid({ onCompareBranches: onCompare });

    fireEvent.click(screen.getByText(/对比预览/));
    expect(onCompare).toHaveBeenCalledWith('evt-1', '雨夜码头');
  });

  it('未传 onCompareBranches → 不渲染"对比预览"按钮（向后兼容）', () => {
    renderGrid(); // 无 onCompareBranches
    expect(screen.queryByText(/对比预览/)).not.toBeInTheDocument();
    // 分支列表仍正常渲染
    expect(screen.getByText('上前搭话')).toBeInTheDocument();
  });

  it('未传 eventId → 不渲染"对比预览"按钮（即使有回调）', () => {
    renderGrid({ eventId: undefined, onCompareBranches: vi.fn() });
    expect(screen.queryByText(/对比预览/)).not.toBeInTheDocument();
  });

  it('非 branches 连接器（如 chapters）不渲染"对比预览"按钮', () => {
    const chaptersConnectors = makeConnectors({
      chapters: {
        count: 1,
        preview: [{ id: 'ch-1', title: '第一章', orderIndex: 0, storyId: 's-1', branchId: null }],
      },
    });
    render(
      <MemoryRouter>
        <EventConnectorInlineGrid
          connectors={chaptersConnectors}
          activeKey="chapters"
          eventId="evt-1"
          eventTitle="X"
          onCompareBranches={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByText(/对比预览/)).not.toBeInTheDocument();
  });
});
