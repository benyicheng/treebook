/**
 * Phase 4 zod schema 校验测试
 *
 * 覆盖 forkReadingPathRequest / getBranchComparisonRequest 的边界：
 * - 合法输入通过
 * - branchOptions 数量越界（<2 / >5）拒绝
 * - primary 不在 options 内（schema 不校验此业务规则，由 Service 校验，这里只测 schema 层）
 * - 非法 UUID 拒绝
 */

import { describe, it, expect } from 'vitest';
import {
  forkReadingPathRequest,
  getBranchComparisonRequest,
} from '../validation';

const UUID_A = 'a09c8d4c-1234-4cda-9abc-000000000001';
const UUID_B = 'a09c8d4c-1234-4cda-9abc-000000000002';
const UUID_C = 'a09c8d4c-1234-4cda-9abc-000000000003';
const UUID_D = 'a09c8d4c-1234-4cda-9abc-000000000004';
const UUID_E = 'a09c8d4c-1234-4cda-9abc-000000000005';
const UUID_F = 'a09c8d4c-1234-4cda-9abc-000000000006';
const PATH_ID = 'a09c8d4c-1234-4cda-9abc-000000000aaa';

describe('forkReadingPathRequest', () => {
  it('合法输入（2 个分支 + primary 在内）通过', () => {
    const parsed = forkReadingPathRequest.parse({
      params: { pathId: PATH_ID },
      body: {
        atEventId: UUID_A,
        branchOptions: [UUID_B, UUID_C],
        primary: UUID_B,
      },
    });
    expect(parsed.body.branchOptions).toHaveLength(2);
    expect(parsed.body.primary).toBe(UUID_B);
  });

  it('5 个分支（上限）通过', () => {
    const parsed = forkReadingPathRequest.parse({
      params: { pathId: PATH_ID },
      body: {
        atEventId: UUID_A,
        branchOptions: [UUID_B, UUID_C, UUID_D, UUID_E, UUID_F],
        primary: UUID_C,
      },
    });
    expect(parsed.body.branchOptions).toHaveLength(5);
  });

  it('1 个分支（下限以下）拒绝', () => {
    expect(() =>
      forkReadingPathRequest.parse({
        params: { pathId: PATH_ID },
        body: { atEventId: UUID_A, branchOptions: [UUID_B], primary: UUID_B },
      }),
    ).toThrow();
  });

  it('6 个分支（上限以上）拒绝', () => {
    expect(() =>
      forkReadingPathRequest.parse({
        params: { pathId: PATH_ID },
        body: {
          atEventId: UUID_A,
          branchOptions: [UUID_B, UUID_C, UUID_D, UUID_E, UUID_F, UUID_A],
          primary: UUID_B,
        },
      }),
    ).toThrow();
  });

  it('非 UUID 的 branchOptions 拒绝', () => {
    expect(() =>
      forkReadingPathRequest.parse({
        params: { pathId: PATH_ID },
        body: {
          atEventId: UUID_A,
          branchOptions: ['not-a-uuid', UUID_C],
          primary: 'not-a-uuid',
        },
      }),
    ).toThrow();
  });

  it('pathId 非 UUID 拒绝', () => {
    expect(() =>
      forkReadingPathRequest.parse({
        params: { pathId: 'invalid' },
        body: { atEventId: UUID_A, branchOptions: [UUID_B, UUID_C], primary: UUID_B },
      }),
    ).toThrow();
  });

  it('缺少 atEventId 拒绝', () => {
    expect(() =>
      forkReadingPathRequest.parse({
        params: { pathId: PATH_ID },
        body: { branchOptions: [UUID_B, UUID_C], primary: UUID_B },
      }),
    ).toThrow();
  });
});

describe('getBranchComparisonRequest', () => {
  it('合法 eventId 通过', () => {
    const parsed = getBranchComparisonRequest.parse({ params: { eventId: UUID_A } });
    expect(parsed.params.eventId).toBe(UUID_A);
  });

  it('非 UUID 的 eventId 拒绝', () => {
    expect(() =>
      getBranchComparisonRequest.parse({ params: { eventId: 'not-uuid' } }),
    ).toThrow();
  });

  it('缺少 eventId 拒绝', () => {
    expect(() => getBranchComparisonRequest.parse({ params: {} })).toThrow();
  });
});
