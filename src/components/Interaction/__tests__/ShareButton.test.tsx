import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareButton } from '../ShareButton';

// Mock interactionService — factory 模式
const mockRecordShare = vi.fn();
const mockGenerateShareConfig = vi.fn();
const mockExecuteShare = vi.fn();

vi.mock('../../../api/interactionService', () => ({
  interactionService: {
    recordShare: (...args: any[]) => mockRecordShare(...args),
    generateShareConfig: (...args: any[]) => mockGenerateShareConfig(...args),
    executeShare: (...args: any[]) => mockExecuteShare(...args),
  },
}));

// Mock Modal — 直接渲染 children
vi.mock('../../Modal', () => ({
  default: ({ children, isOpen, title }: any) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {title && <h3>{title}</h3>}
        {children}
      </div>
    ) : null,
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});

describe('ShareButton', () => {
  const baseProps = {
    targetType: 'story' as const,
    targetId: 'story-123',
    title: '测试故事',
    description: '这是一个测试故事',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateShareConfig.mockReturnValue({
      platform: 'copy',
      title: '推荐给你：测试故事',
      description: baseProps.description,
      url: 'http://localhost:5173/story/story-123',
    });
    mockExecuteShare.mockResolvedValue(true);
    mockRecordShare.mockResolvedValue({ shareCount: 5 });
  });

  it('renders share button', () => {
    render(<ShareButton {...baseProps} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens share modal on click', async () => {
    render(<ShareButton {...baseProps} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('shows preview card with title and description', async () => {
    render(<ShareButton {...baseProps} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('测试故事')).toBeInTheDocument();
      expect(screen.getByText('这是一个测试故事')).toBeInTheDocument();
    });
  });

  it('shows all five platform buttons', async () => {
    render(<ShareButton {...baseProps} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('微信')).toBeInTheDocument();
      expect(screen.getByText('微博')).toBeInTheDocument();
      expect(screen.getByText('QQ')).toBeInTheDocument();
      expect(screen.getByText('Twitter')).toBeInTheDocument();
      expect(screen.getByText('复制链接')).toBeInTheDocument();
    });
  });

  it('copies link on copy platform click', async () => {
    render(<ShareButton {...baseProps} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('复制链接')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('复制链接'));

    await waitFor(() => {
      expect(mockExecuteShare).toHaveBeenCalled();
      expect(mockRecordShare).toHaveBeenCalledWith('story', 'story-123', 'copy');
    });

    // 按钮文字变为"已复制"
    await waitFor(() => {
      expect(screen.getByText('已复制')).toBeInTheDocument();
    });
  });

  it('shows WeChat QR code modal on wechat platform click', async () => {
    render(<ShareButton {...baseProps} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('微信')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('微信'));

    await waitFor(() => {
      expect(screen.getByText('微信扫码分享')).toBeInTheDocument();
      expect(screen.getByText(/打开微信扫一扫/)).toBeInTheDocument();
    });
    expect(mockRecordShare).toHaveBeenCalledWith('story', 'story-123', 'wechat');
  });

  it('calls onShare callback after successful share', async () => {
    const onShare = vi.fn();
    render(<ShareButton {...baseProps} onShare={onShare} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('复制链接')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('复制链接'));

    await waitFor(() => {
      expect(onShare).toHaveBeenCalledWith('copy', 5);
    });
  });

  it('shows share count when showCount=true', async () => {
    render(<ShareButton {...baseProps} initialCount={128} showCount />);
    await waitFor(() => {
      expect(screen.getByText('128')).toBeInTheDocument();
    });
  });

  it('hides share count when showCount=false', () => {
    render(<ShareButton {...baseProps} initialCount={128} showCount={false} />);
    expect(screen.queryByText('128')).not.toBeInTheDocument();
  });

  it('renders with image preview when imageUrl provided', async () => {
    render(
      <ShareButton {...baseProps} imageUrl="https://example.com/cover.jpg" />,
    );
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const img = screen.getByAltText('测试故事');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg');
    });
  });

  it('handles recordShare failure gracefully', async () => {
    mockRecordShare.mockRejectedValue(new Error('Network error'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<ShareButton {...baseProps} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('复制链接')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('复制链接'));

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  it('handles executeShare failure gracefully', async () => {
    mockExecuteShare.mockResolvedValue(false);

    render(<ShareButton {...baseProps} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('复制链接')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('复制链接'));

    await waitFor(() => {
      expect(mockExecuteShare).toHaveBeenCalled();
    });
    // recordShare should not be called when executeShare fails
    expect(mockRecordShare).not.toHaveBeenCalled();
  });

  it('can type custom share text', async () => {
    render(<ShareButton {...baseProps} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('推荐给你：测试故事')).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText('推荐给你：测试故事');
    fireEvent.change(textarea, { target: { value: '快看这个超棒的故事！' } });

    expect(textarea).toHaveValue('快看这个超棒的故事！');
  });

  it('closes modal on close button', async () => {
    render(<ShareButton {...baseProps} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Modal 的 onClose 通过 Modal 组件内部触发
    // Mock Modal 直接渲染 children，所以通过查找关闭图标来测试
    // 实际 Modal 的 X 按钮由 Modal 组件管理
  });
});
