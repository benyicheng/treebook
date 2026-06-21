import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EventConnectorBar from '../EventConnectorBar';
import type { EventConnectors, ConnectorKey } from '../../../../api/eventConnectorService';

/** 构造一个完整的 connectors 对象 */
const makeConnectors = (overrides: Partial<EventConnectors> = {}): EventConnectors => ({
  chapters: { count: 0, preview: [] },
  characters: { count: 0, preview: [] },
  wiki: { count: 0, preview: [] },
  branches: { count: 0, preview: [] },
  spinoffs: { count: 0, preview: [] },
  readingPaths: { count: 0, preview: [] },
  ...overrides,
});

describe('EventConnectorBar', () => {
  let onSelect: ReturnType<typeof vi.fn<(key: ConnectorKey | null) => void>>;

  beforeEach(() => {
    onSelect = vi.fn<(key: ConnectorKey | null) => void>();
  });

  it('渲染 6 格徽标', () => {
    render(
      <EventConnectorBar
        connectors={makeConnectors({
          chapters: { count: 1, preview: [] },
          characters: { count: 3, preview: [] },
          branches: { count: 2, preview: [] },
        })}
        activeKey={null}
        onSelect={onSelect}
      />,
    );

    // 通过 aria-label 定位（不依赖图标视觉）
    expect(screen.getByLabelText('章节 1 个')).toBeInTheDocument();
    expect(screen.getByLabelText('角色 3 个')).toBeInTheDocument();
    expect(screen.getByLabelText('地点 0 个')).toBeInTheDocument();
    expect(screen.getByLabelText('分支 2 个')).toBeInTheDocument();
    expect(screen.getByLabelText('番外 0 个')).toBeInTheDocument();
    expect(screen.getByLabelText('路径 0 个')).toBeInTheDocument();
  });

  it('count=0 的徽标 disabled，无法点击触发 onSelect', () => {
    render(
      <EventConnectorBar
        connectors={makeConnectors()}
        activeKey={null}
        onSelect={onSelect}
      />,
    );

    const emptyButton = screen.getByLabelText('章节 0 个');
    expect(emptyButton).toBeDisabled();

    fireEvent.click(emptyButton);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('count>0 的徽标可点击，传出对应 key', () => {
    render(
      <EventConnectorBar
        connectors={makeConnectors({
          characters: { count: 3, preview: [] },
        })}
        activeKey={null}
        onSelect={onSelect}
      />,
    );

    fireEvent.click(screen.getByLabelText('角色 3 个'));
    expect(onSelect).toHaveBeenCalledWith('characters');
  });

  it('再次点击当前 active 徽标 → 传 null（折叠）', () => {
    render(
      <EventConnectorBar
        connectors={makeConnectors({
          characters: { count: 3, preview: [] },
        })}
        activeKey="characters"
        onSelect={onSelect}
      />,
    );

    const btn = screen.getByLabelText('角色 3 个');
    expect(btn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(btn);
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('aria-pressed 反映 activeKey 状态', () => {
    render(
      <EventConnectorBar
        connectors={makeConnectors({
          chapters: { count: 1, preview: [] },
          characters: { count: 3, preview: [] },
        })}
        activeKey="chapters"
        onSelect={onSelect}
      />,
    );

    expect(screen.getByLabelText('章节 1 个')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('角色 3 个')).toHaveAttribute('aria-pressed', 'false');
  });
});
