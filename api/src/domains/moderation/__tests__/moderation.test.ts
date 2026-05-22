import { describe, it, expect } from 'vitest';
import { moderationConfigSchema } from '../config';
import { isInModerationRollout } from '../rollout';
import { TextRuleProvider } from '../providers/TextRuleProvider';
import { ModerationOrchestrator } from '../ModerationOrchestrator';

describe('moderation rollout', () => {
  it('returns true when rollout disabled', () => {
    const cfg = moderationConfigSchema.parse({ mode: 'observe', rollout: { enabled: false } });
    expect(isInModerationRollout(cfg, 'u1', 'chapters')).toBe(true);
  });

  it('honors userIds allowlist', () => {
    const cfg = moderationConfigSchema.parse({ mode: 'observe', rollout: { enabled: true, percent: 0, userIds: ['u1'] } });
    expect(isInModerationRollout(cfg, 'u1', 'chapters')).toBe(true);
    expect(isInModerationRollout(cfg, 'u2', 'chapters')).toBe(false);
  });
});

describe('TextRuleProvider', () => {
  it('rejects when hit block words', async () => {
    const p = new TextRuleProvider();
    const res = await p.moderate({
      businessLine: 'comments',
      targetType: 'comment',
      targetId: 'c1',
      contentType: 'text',
      text: '加微信联系我',
      createdAt: new Date().toISOString(),
    });
    expect(res.status).toBe('rejected');
    expect(res.labels).toContain('illegal');
  });
});

describe('ModerationOrchestrator', () => {
  it('moderates text with rules', async () => {
    const cfg = moderationConfigSchema.parse({ mode: 'observe' });
    const o = new ModerationOrchestrator(cfg);
    const res = await o.moderate({
      businessLine: 'chapters',
      targetType: 'chapter',
      targetId: 'ch1',
      contentType: 'text',
      text: '这里有赌博信息',
      createdAt: new Date().toISOString(),
    });
    expect(['approved', 'rejected', 'failed']).toContain(res.status);
  });
});

