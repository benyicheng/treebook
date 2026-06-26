import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../EmptyState';
import { BookOpen, Sparkles } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState icon={BookOpen} title="暂无内容" description="快去添加吧" />);
    expect(screen.getByText('暂无内容')).toBeInTheDocument();
    expect(screen.getByText('快去添加吧')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const onClick = vi.fn();
    render(<EmptyState icon={Sparkles} title="空" action={{ label: '去创建', onClick }} />);
    const btn = screen.getByText('去创建');
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not render action when not provided', () => {
    render(<EmptyState icon={BookOpen} title="空" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders without icon', () => {
    render(<EmptyState title="无图标" />);
    expect(screen.getByText('无图标')).toBeInTheDocument();
  });
});
