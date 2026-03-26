import { describe, it, expect, vi, beforeEach } from 'vitest';
import { interactionService, RATING_REASON_TAGS } from '../interactionService';
import client from '../client';

// Mock axios client
vi.mock('../client');

describe('interactionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStats', () => {
    it('fetches interaction stats successfully', async () => {
      const mockStats = {
        targetType: 'story',
        targetId: 'test-id',
        likeCount: 100,
        shareCount: 50,
        ratingCount: 30,
        ratingAvg: 4.5,
        ratingDist: { '8': 20, '9': 10 },
        liked: false,
        myRating: null,
        myReasonTags: [],
      };

      (client.get as any).mockResolvedValue({ data: mockStats });

      const result = await interactionService.getStats('story', 'test-id');

      expect(client.get).toHaveBeenCalledWith('/interactions/story/test-id');
      expect(result).toEqual(mockStats);
    });
  });

  describe('toggleLike', () => {
    it('toggles like successfully', async () => {
      const mockResponse = { liked: true, likeCount: 101 };
      (client.post as any).mockResolvedValue({ data: mockResponse });

      const result = await interactionService.toggleLike('story', 'test-id');

      expect(client.post).toHaveBeenCalledWith('/interactions/story/test-id/like');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('submitRating', () => {
    it('submits rating with score and tags', async () => {
      const mockResponse = {
        targetType: 'story',
        targetId: 'test-id',
        ratingCount: 31,
        ratingAvg: 4.5,
      };
      (client.put as any).mockResolvedValue({ data: mockResponse });

      const request = { score: 4.5, reasonTags: ['剧情精彩'] };
      const result = await interactionService.submitRating('story', 'test-id', request);

      expect(client.put).toHaveBeenCalledWith(
        '/interactions/story/test-id/rating',
        request
      );
      expect(result).toEqual(mockResponse);
    });

    it('validates score range', async () => {
      const mockResponse = { ratingCount: 30, ratingAvg: 4.5 };
      (client.put as any).mockResolvedValue({ data: mockResponse });

      // Valid scores
      await interactionService.submitRating('story', 'test-id', { score: 0.5 });
      await interactionService.submitRating('story', 'test-id', { score: 5 });
      await interactionService.submitRating('story', 'test-id', { score: 3.5 });

      expect(client.put).toHaveBeenCalledTimes(3);
    });
  });

  describe('recordShare', () => {
    it('records share with platform', async () => {
      const mockResponse = { shareCount: 51 };
      (client.post as any).mockResolvedValue({ data: mockResponse });

      const result = await interactionService.recordShare('story', 'test-id', 'wechat');

      expect(client.post).toHaveBeenCalledWith(
        '/interactions/story/test-id/share',
        { platform: 'wechat' }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('generateShareConfig', () => {
    it('generates correct URL for story', () => {
      const config = interactionService.generateShareConfig(
        'wechat',
        'story',
        'test-id',
        'Test Title',
        'Test Description'
      );

      expect(config.url).toContain('/story/test-id');
      expect(config.title).toBe('Test Title');
      expect(config.description).toBe('Test Description');
    });

    it('generates correct URL for booklist', () => {
      const config = interactionService.generateShareConfig(
        'weibo',
        'booklist',
        'list-id',
        'My Booklist',
        'Check this out'
      );

      expect(config.url).toContain('/booklist/list-id');
    });
  });

  describe('executeShare', () => {
    it('opens window for weibo share', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      await interactionService.executeShare({
        platform: 'weibo',
        title: 'Test',
        description: 'Description',
        url: 'http://example.com',
      });

      expect(openSpy).toHaveBeenCalledWith(
        expect.stringContaining('service.weibo.com'),
        '_blank',
        expect.any(String)
      );
    });

    it('copies to clipboard for copy platform', async () => {
      const writeTextSpy = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextSpy },
      });

      const result = await interactionService.executeShare({
        platform: 'copy',
        title: 'Test',
        description: 'Description',
        url: 'http://example.com',
      });

      expect(writeTextSpy).toHaveBeenCalledWith('Test\nDescription\nhttp://example.com');
      expect(result).toBe(true);
    });
  });

  describe('RATING_REASON_TAGS', () => {
    it('contains expected tags', () => {
      expect(RATING_REASON_TAGS).toContain('剧情精彩');
      expect(RATING_REASON_TAGS).toContain('人物立体');
      expect(RATING_REASON_TAGS).toContain('文笔优美');
      expect(RATING_REASON_TAGS.length).toBe(12);
    });
  });
});
