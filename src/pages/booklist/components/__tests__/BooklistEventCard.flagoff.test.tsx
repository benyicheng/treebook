/**
 * 零回归保证测试：flag-off 时 BooklistEventCard 不渲染六向连接器，
 * 与功能上线前 UI 完全一致。
 *
 * 这是 Phase 2 最重要的回归保护：feature flag 的本质契约。
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BooklistEventCard from '../BooklistEventCard';

// Mock context — 默认 active=false（flag off 状态）
const { mockUseEventConnector } = vi.hoisted(() => ({
  mockUseEventConnector: vi.fn(),
}));
vi.mock('../EventConnectorsContext', () => ({
  useEventConnector: (...args: unknown[]) => mockUseEventConnector(...args),
}));

// Mock BranchCompareDrawer —— 它内部用 useToast 需要 ToastProvider 上下文，
// 但 flag-off 测试不关心 Drawer 行为，直接桩掉避免上下文依赖。
vi.mock('../BranchCompareDrawer', () => ({
  default: () => null,
}));

// Mock navigation store
vi.mock('../../../../stores/useNavigationStackStore', () => ({
  useNavigationStackStore: () => ({ openDrawer: vi.fn() }),
}));

const baseEvent = {
  id: 'evt-1',
  storyId: 'sty-1',
  title: '雨夜码头',
  description: '主角在暴雨中遇见 X',
  type: 'turning_point',
  importance: 4,
  color: '#f43f5e',
  nodes: [
    { id: 'n-1', targetType: 'chapter', targetId: 'chp-1', sortOrder: 0 },
    { id: 'n-2', targetType: 'branch', targetId: 'br-1', sortOrder: 1 },
  ],
};

const baseItem = { id: 'item-1', event: baseEvent, notes: null };

const renderCard = () =>
  render(
    <MemoryRouter>
      <BooklistEventCard
        item={baseItem}
        isCreator={false}
        onRemove={vi.fn()}
        onEditNotes={vi.fn()}
      />
    </MemoryRouter>,
  );

describe('BooklistEventCard · flag-off 零回归', () => {
  it('connector context active=false → 不渲染六向连接器 Bar/Grid', () => {
    mockUseEventConnector.mockReturnValue({ active: false });
    renderCard();

    // 事件本身正常渲染
    expect(screen.getByText('雨夜码头')).toBeInTheDocument();
    expect(screen.getByText('主角在暴雨中遇见 X')).toBeInTheDocument();

    // 6 个连接器徽标都不应出现（用 aria-label 检测）
    expect(screen.queryByLabelText(/章节 \d+ 个/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/角色 \d+ 个/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/地点 \d+ 个/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/分支 \d+ 个/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/番外 \d+ 个/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/路径 \d+ 个/)).not.toBeInTheDocument();
  });

  it('connector context active=true → 渲染 6 格徽标', () => {
    mockUseEventConnector.mockReturnValue({
      active: true,
      isBranchPoint: true,
      connectors: {
        chapters: { count: 2, preview: [] },
        characters: { count: 3, preview: [] },
        wiki: { count: 0, preview: [] },
        branches: { count: 1, preview: [] },
        spinoffs: { count: 0, preview: [] },
        readingPaths: { count: 4, preview: [] },
      },
    });
    renderCard();

    expect(screen.getByLabelText('章节 2 个')).toBeInTheDocument();
    expect(screen.getByLabelText('角色 3 个')).toBeInTheDocument();
    expect(screen.getByLabelText('地点 0 个')).toBeInTheDocument();
    expect(screen.getByLabelText('分支 1 个')).toBeInTheDocument();
    expect(screen.getByLabelText('番外 0 个')).toBeInTheDocument();
    expect(screen.getByLabelText('路径 4 个')).toBeInTheDocument();
  });
});
