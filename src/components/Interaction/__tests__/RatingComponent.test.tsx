import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RatingComponent } from '../RatingComponent';
import { interactionService } from '../../../api/interactionService';
import { useAuthStore } from '../../../stores/useAuthStore';

// Mock 依赖 — factory 模式确保方法可被 spy
vi.mock('../../../api/interactionService', () => ({
  interactionService: {
    getStats: vi.fn(),
    submitRating: vi.fn(),
  },
  RATING_REASON_TAGS: [
    '剧情精彩', '人物立体', '文笔优美', '设定新颖', '节奏紧凑',
    '情感真挚', '脑洞大开', '逻辑严密', '更新稳定', '互动性强',
    '值得收藏', '强烈推荐',
  ],
}));

vi.mock('../../../stores/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('../../Toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

// framer-motion 用原生 HTML 元素替代，避免动画干扰测试
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// ---------- 测试默认 props 工厂 ----------
const defaultProps = {
  targetType: 'story' as const,
  targetId: 'test-id',
  ratingCount: 42,
  ratingAvg: 4.2,
  ratingDist: { '8': 20, '10': 15, '6': 5, '4': 2 } as Record<string, number>,
};

describe('RatingComponent', () => {
  beforeEach(() => {
    (useAuthStore as any).mockReturnValue({ isAuthenticated: true });
    // 默认 getStats 返回与 props 一致的数据（避免 UI 闪烁）
    (interactionService.getStats as any).mockResolvedValue({
      liked: false, likeCount: 0, shareCount: 0,
      ratingCount: 42, ratingAvg: 4.2,
      ratingDist: { '8': 20, '10': 15, '6': 5, '4': 2 },
      myRating: null, myReasonTags: [], viewCount: 100,
    });
  });

  // ============ 渲染 ============
  describe('渲染', () => {
    it('显示平均分和评分人数', () => {
      render(<RatingComponent {...defaultProps} />);
      expect(screen.getByText('4.2')).toBeInTheDocument();
      expect(screen.getByText('(42人评分)')).toBeInTheDocument();
    });

    it('隐藏详情（showDetail=false）', () => {
      render(<RatingComponent {...defaultProps} showDetail={false} />);
      expect(screen.queryByText(/人评分/)).not.toBeInTheDocument();
    });

    it('显示评分分布条形图', () => {
      render(<RatingComponent {...defaultProps} />);
      expect(screen.getByText('5星')).toBeInTheDocument();
      expect(screen.getByText('4星')).toBeInTheDocument();
      expect(screen.getByText('3星')).toBeInTheDocument();
    });

    it('无评分时隐藏分布图', () => {
      render(
        <RatingComponent
          {...defaultProps}
          ratingCount={0}
          ratingAvg={0}
          ratingDist={{}}
        />,
      );
      expect(screen.queryByText('5星')).not.toBeInTheDocument();
    });

    it('sm 尺寸可渲染', () => {
      render(<RatingComponent {...defaultProps} size="sm" />);
      expect(screen.getByText('(42人评分)')).toBeInTheDocument();
    });

    it('lg 尺寸可渲染', () => {
      render(<RatingComponent {...defaultProps} size="lg" />);
      expect(screen.getByText('(42人评分)')).toBeInTheDocument();
    });

    it('触发异步 getStats 获取最新数据', async () => {
      render(<RatingComponent targetType="story" targetId="fetch-test" />);
      await waitFor(() => {
        expect(interactionService.getStats).toHaveBeenCalledWith('story', 'fetch-test');
      });
    });
  });

  // ============ 未登录 ============
  describe('未登录状态', () => {
    it('点击星星触发登录提示', async () => {
      (useAuthStore as any).mockReturnValue({ isAuthenticated: false });
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      render(<RatingComponent {...defaultProps} />);

      const stars = document.querySelectorAll('.cursor-pointer');
      fireEvent.click(stars[0], { clientX: 20 });
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'show-login-prompt' }),
      );
    });
  });

  // ============ 评分弹窗 ============
  describe('评分弹窗', () => {
    it('点击星星打开评分弹窗', async () => {
      render(<RatingComponent {...defaultProps} />);

      const stars = document.querySelectorAll('.cursor-pointer');
      fireEvent.click(stars[0], { clientX: 20 });

      await waitFor(() => {
        expect(screen.getByText('为什么给出这个评分？')).toBeInTheDocument();
      });
    });

    it('点击星星左侧为半星评分', async () => {
      render(<RatingComponent {...defaultProps} />);

      // jsdom 默认 getBoundingClientRect 返回全零，需 mock
      const stars = document.querySelectorAll('.cursor-pointer');
      const mockRect = vi
        .spyOn(stars[2] as HTMLElement, 'getBoundingClientRect')
        .mockReturnValue({ left: 0, width: 100, right: 100, top: 0, bottom: 50, height: 50, x: 0, y: 0, toJSON: () => {} } as DOMRect);

      // clientX=30 < left(0)+width/2(50) → 半星
      fireEvent.click(stars[2], { clientX: 30 });

      mockRect.mockRestore();

      await waitFor(() => {
        expect(screen.getByText('2.5')).toBeInTheDocument();
      });
    });

    it('点击右侧为整数评分', async () => {
      render(<RatingComponent {...defaultProps} />);

      const stars = document.querySelectorAll('.cursor-pointer');
      fireEvent.click(stars[3], { clientX: 30 }); // 第4颗星右侧 = 4

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument();
      });
    });

    it('选择 / 取消评分标签', async () => {
      render(<RatingComponent {...defaultProps} />);

      fireEvent.click(document.querySelectorAll('.cursor-pointer')[0], { clientX: 20 });

      await waitFor(() => screen.getByText('为什么给出这个评分？'));

      const tag = screen.getByText('剧情精彩');
      fireEvent.click(tag);
      expect(tag.className).toContain('amber');

      fireEvent.click(tag);
      expect(tag.className).not.toContain('amber');
    });

    it('最多选择 5 个标签，第 6 个不被添加', async () => {
      render(<RatingComponent {...defaultProps} />);

      fireEvent.click(document.querySelectorAll('.cursor-pointer')[0], { clientX: 20 });
      await waitFor(() => screen.getByText('为什么给出这个评分？'));

      const tags = ['剧情精彩', '人物立体', '文笔优美', '设定新颖', '节奏紧凑', '情感真挚'];
      tags.forEach((t) => fireEvent.click(screen.getByText(t)));

      expect(screen.getByText('剧情精彩').className).toContain('amber');
      expect(screen.getByText('节奏紧凑').className).toContain('amber');
      // 第6个不应选中
      expect(screen.getByText('情感真挚').className).not.toContain('amber');
    });

    it('取消按钮关闭弹窗', async () => {
      render(<RatingComponent {...defaultProps} />);

      fireEvent.click(document.querySelectorAll('.cursor-pointer')[0], { clientX: 20 });
      await waitFor(() => screen.getByText('为什么给出这个评分？'));

      fireEvent.click(screen.getByText('取消'));
      await waitFor(() => {
        expect(screen.queryByText('为什么给出这个评分？')).not.toBeInTheDocument();
      });
    });
  });

  // ============ 提交评分 ============
  describe('提交评分', () => {
    beforeEach(() => {
      (interactionService.submitRating as any).mockResolvedValue({
        liked: false, likeCount: 0, shareCount: 0,
        ratingCount: 43, ratingAvg: 4.3,
        ratingDist: {}, myRating: 4, myReasonTags: [], viewCount: 100,
      });
    });

    it('提交评分时传递 score 和 reasonTags', async () => {
      render(<RatingComponent {...defaultProps} />);

      // 点击第4颗星右侧 = 4分
      fireEvent.click(document.querySelectorAll('.cursor-pointer')[3], { clientX: 30 });
      await waitFor(() => screen.getByText('为什么给出这个评分？'));

      fireEvent.click(screen.getByText('剧情精彩'));
      fireEvent.click(screen.getByText('文笔优美'));
      fireEvent.click(screen.getByText('确认评分'));

      await waitFor(() => {
        expect(interactionService.submitRating).toHaveBeenCalledWith('story', 'test-id', {
          score: 4,
          reasonTags: ['剧情精彩', '文笔优美'],
        });
      });
    });

    it('成功提交后调用 onRatingChange 回调', async () => {
      const onRatingChange = vi.fn();

      render(<RatingComponent {...defaultProps} onRatingChange={onRatingChange} />);

      const stars = document.querySelectorAll('.cursor-pointer');
      const mockRect = vi
        .spyOn(stars[2] as HTMLElement, 'getBoundingClientRect')
        .mockReturnValue({ left: 0, width: 100, right: 100, top: 0, bottom: 50, height: 50, x: 0, y: 0, toJSON: () => {} } as DOMRect);

      // clientX=30 < 50 → 半星 = 2.5 分
      fireEvent.click(stars[2], { clientX: 30 });

      mockRect.mockRestore();

      await waitFor(() => screen.getByText('为什么给出这个评分？'));
      fireEvent.click(screen.getByText('确认评分'));

      await waitFor(() => {
        expect(onRatingChange).toHaveBeenCalledWith(2.5, []);
      });
    });

    it('提交中按钮显示 loading 状态', async () => {
      // 让 submitRating 延迟，观察 loading 状态
      let resolveSubmit: (v: any) => void;
      const pendingPromise = new Promise((resolve) => { resolveSubmit = resolve; });
      (interactionService.submitRating as any).mockReturnValue(pendingPromise);

      render(<RatingComponent {...defaultProps} />);

      fireEvent.click(document.querySelectorAll('.cursor-pointer')[0], { clientX: 20 });
      await waitFor(() => screen.getByText('为什么给出这个评分？'));

      fireEvent.click(screen.getByText('确认评分'));
      expect(screen.getByText('提交中...')).toBeInTheDocument();

      // 完成请求
      resolveSubmit!({
        liked: false, likeCount: 0, shareCount: 0,
        ratingCount: 43, ratingAvg: 4.3,
        ratingDist: {}, myRating: 3, myReasonTags: [], viewCount: 100,
      });
    });
  });

  // ============ 错误处理 ============
  describe('错误处理', () => {
    async function openModalAndSubmit(mockError: any) {
      (interactionService.submitRating as any).mockRejectedValue(mockError);
      (interactionService.getStats as any).mockResolvedValue({
        liked: false, likeCount: 0, shareCount: 0,
        ratingCount: 42, ratingAvg: 4.2, ratingDist: {},
        myRating: null, myReasonTags: [], viewCount: 100,
      });

      render(<RatingComponent {...defaultProps} />);

      fireEvent.click(document.querySelectorAll('.cursor-pointer')[0], { clientX: 20 });
      await waitFor(() => screen.getByText('为什么给出这个评分？'));

      fireEvent.click(screen.getByText('确认评分'));
    }

    it('401 错误后按钮恢复可用', async () => {
      await openModalAndSubmit({ response: { status: 401 } });
      await waitFor(() => {
        expect(screen.getByText('确认评分')).not.toBeDisabled();
      });
    });

    it('429 限流错误后按钮恢复可用', async () => {
      await openModalAndSubmit({ response: { status: 429 } });
      await waitFor(() => {
        expect(screen.getByText('确认评分')).not.toBeDisabled();
      });
    });

    it('VALIDATION_ERROR 后按钮恢复可用', async () => {
      await openModalAndSubmit({
        response: {
          status: 400,
          data: { code: 'VALIDATION_ERROR', message: '分数无效' },
        },
      });
      await waitFor(() => {
        expect(screen.getByText('确认评分')).not.toBeDisabled();
      });
    });
  });
});
