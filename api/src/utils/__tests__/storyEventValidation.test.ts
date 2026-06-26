/**
 * StoryEvent zod 校验测试
 *
 * 覆盖 createEventRequest / updateEventRequest / addEventNodeRequest 的边界：
 * - 合法输入通过
 * - importance 越界（0 / 6）拒绝
 * - type 非法值拒绝
 * - color 非 #RRGGBB 格式拒绝
 * - 缺少必填字段拒绝
 */

import { describe, it, expect } from 'vitest';
import {
  createEventRequest,
  updateEventRequest,
  addEventNodeRequest,
} from '../validation';

const STORY_ID = 'a09c8d4c-1234-4cda-9abc-000000000001';
const EVENT_ID = 'a09c8d4c-1234-4cda-9abc-000000000002';
const TARGET_ID = 'a09c8d4c-1234-4cda-9abc-000000000003';

describe('createEventRequest', () => {
  it('合法输入通过', () => {
    const parsed = createEventRequest.parse({
      body: {
        storyId: STORY_ID,
        title: '决战紫禁之巅',
        description: '武林巅峰对决',
        type: 'climax',
        importance: 5,
        color: '#f43f5e',
      },
    });
    expect(parsed.body.title).toBe('决战紫禁之巅');
    expect(parsed.body.importance).toBe(5);
  });

  it('importance=0 被拒绝', () => {
    expect(() =>
      createEventRequest.parse({
        body: { storyId: STORY_ID, title: '事件', importance: 0 },
      }),
    ).toThrow();
  });

  it('importance=6 被拒绝', () => {
    expect(() =>
      createEventRequest.parse({
        body: { storyId: STORY_ID, title: '事件', importance: 6 },
      }),
    ).toThrow();
  });

  it('非法 type 被拒绝', () => {
    expect(() =>
      createEventRequest.parse({
        body: { storyId: STORY_ID, title: '事件', type: 'invalid_type' },
      }),
    ).toThrow();
  });

  it('color 非 #RRGGBB 格式被拒绝', () => {
    expect(() =>
      createEventRequest.parse({
        body: { storyId: STORY_ID, title: '事件', color: 'red' },
      }),
    ).toThrow();
  });

  it('缺少 storyId 被拒绝', () => {
    expect(() =>
      createEventRequest.parse({ body: { title: '事件' } }),
    ).toThrow();
  });

  it('title 超过 100 字被拒绝', () => {
    expect(() =>
      createEventRequest.parse({
        body: { storyId: STORY_ID, title: 'a'.repeat(101) },
      }),
    ).toThrow();
  });
});

describe('updateEventRequest', () => {
  it('合法部分更新通过', () => {
    const parsed = updateEventRequest.parse({
      params: { id: EVENT_ID },
      body: { title: '新标题', importance: 3 },
    });
    expect(parsed.body.title).toBe('新标题');
  });

  it('importance 越界被拒绝', () => {
    expect(() =>
      updateEventRequest.parse({
        params: { id: EVENT_ID },
        body: { importance: 99 },
      }),
    ).toThrow();
  });

  it('非法 type 被拒绝', () => {
    expect(() =>
      updateEventRequest.parse({
        params: { id: EVENT_ID },
        body: { type: 'not_a_real_type' },
      }),
    ).toThrow();
  });
});

describe('addEventNodeRequest', () => {
  it('合法输入通过', () => {
    const parsed = addEventNodeRequest.parse({
      params: { eventId: EVENT_ID },
      body: { targetType: 'chapter', targetId: TARGET_ID, note: '决战之地' },
    });
    expect(parsed.body.targetType).toBe('chapter');
    expect(parsed.body.note).toBe('决战之地');
  });

  it('非法 targetType 被拒绝', () => {
    expect(() =>
      addEventNodeRequest.parse({
        params: { eventId: EVENT_ID },
        body: { targetType: 'story', targetId: TARGET_ID },
      }),
    ).toThrow();
  });

  it('note 超过 500 字被拒绝', () => {
    expect(() =>
      addEventNodeRequest.parse({
        params: { eventId: EVENT_ID },
        body: { targetType: 'chapter', targetId: TARGET_ID, note: 'a'.repeat(501) },
      }),
    ).toThrow();
  });
});
