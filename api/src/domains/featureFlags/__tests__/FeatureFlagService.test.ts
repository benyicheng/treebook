import { describe, it, expect, beforeEach } from 'vitest';
import { FeatureFlagService } from '../FeatureFlagService';

describe('FeatureFlagService', () => {
  beforeEach(() => {
    // 每个用例前清空 flag 相关 env，保证用例独立
    delete process.env.FEATURE_EVENT_CONNECTORS;
    delete process.env.FEATURE_EVENT_CONNECTORS_ROLLOUT_PERCENT;
  });

  describe('isEnabled', () => {
    it('flag 关闭时永远返回 false', () => {
      expect(FeatureFlagService.isEnabled('event_connectors', 'user-1')).toBe(false);
    });

    it('flag 开启 + rolloutPercent=100 时，无 userId 也返回 true', () => {
      process.env.FEATURE_EVENT_CONNECTORS = 'true';
      process.env.FEATURE_EVENT_CONNECTORS_ROLLOUT_PERCENT = '100';
      expect(FeatureFlagService.isEnabled('event_connectors')).toBe(true);
    });

    it('flag 开启 + rolloutPercent<100 时，无 userId 返回 false（保守分桶）', () => {
      process.env.FEATURE_EVENT_CONNECTORS = 'true';
      process.env.FEATURE_EVENT_CONNECTORS_ROLLOUT_PERCENT = '50';
      expect(FeatureFlagService.isEnabled('event_connectors')).toBe(false);
    });

    it('flag 开启 + rolloutPercent<100 时，同一 userId 的判定稳定且一致', () => {
      process.env.FEATURE_EVENT_CONNECTORS = 'true';
      process.env.FEATURE_EVENT_CONNECTORS_ROLLOUT_PERCENT = '50';

      const result1 = FeatureFlagService.isEnabled('event_connectors', 'user-stable-1');
      const result2 = FeatureFlagService.isEnabled('event_connectors', 'user-stable-1');
      const result3 = FeatureFlagService.isEnabled('event_connectors', 'user-stable-1');
      // 三次调用结果必须完全一致（稳定性）
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('rolloutPercent=0 时所有用户都被关闭（即使 flag 开）', () => {
      process.env.FEATURE_EVENT_CONNECTORS = 'true';
      process.env.FEATURE_EVENT_CONNECTORS_ROLLOUT_PERCENT = '0';
      expect(FeatureFlagService.isEnabled('event_connectors', 'any-user')).toBe(false);
    });

    it('rolloutPercent 超出范围被截断到 0-100', () => {
      process.env.FEATURE_EVENT_CONNECTORS = 'true';
      process.env.FEATURE_EVENT_CONNECTORS_ROLLOUT_PERCENT = '150';
      // 150 截断到 100 → 无 userId 也 true
      expect(FeatureFlagService.isEnabled('event_connectors')).toBe(true);

      process.env.FEATURE_EVENT_CONNECTORS_ROLLOUT_PERCENT = '-10';
      // -10 截断到 0 → 全关
      expect(FeatureFlagService.isEnabled('event_connectors', 'user-1')).toBe(false);
    });

    it('enabledVar 大小写不敏感（TRUE/True 都算开启）', () => {
      process.env.FEATURE_EVENT_CONNECTORS = 'TRUE';
      process.env.FEATURE_EVENT_CONNECTORS_ROLLOUT_PERCENT = '100';
      expect(FeatureFlagService.isEnabled('event_connectors')).toBe(true);
    });
  });

  describe('describe', () => {
    it('返回完整的调试信息', () => {
      process.env.FEATURE_EVENT_CONNECTORS = 'true';
      process.env.FEATURE_EVENT_CONNECTORS_ROLLOUT_PERCENT = '30';
      const info = FeatureFlagService.describe('event_connectors', 'user-debug-1');
      expect(info).toMatchObject({
        key: 'event_connectors',
        enabled: true,
        rolloutPercent: 30,
      });
      expect(info.bucket).toBeTypeOf('number');
      expect(info.bucket).toBeGreaterThanOrEqual(0);
      expect(info.bucket).toBeLessThan(100);
      // active 与 isEnabled 一致
      expect(info.active).toBe(FeatureFlagService.isEnabled('event_connectors', 'user-debug-1'));
    });

    it('无 userId 时 bucket 为 null', () => {
      process.env.FEATURE_EVENT_CONNECTORS = 'true';
      process.env.FEATURE_EVENT_CONNECTORS_ROLLOUT_PERCENT = '100';
      const info = FeatureFlagService.describe('event_connectors');
      expect(info.bucket).toBeNull();
    });
  });
});
