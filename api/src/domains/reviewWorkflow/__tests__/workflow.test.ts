import { describe, it, expect, vi } from 'vitest';
import { ReviewWorkflowService } from '../ReviewWorkflowService';

vi.mock('../ReviewWorkflowConfigService', () => ({
  ReviewWorkflowConfigService: {
    getConfig: vi.fn(async () => ({ enabled: true, maxLevel: 3, levels: [{ level: 1, slaMinutes: 1 }, { level: 2, slaMinutes: 1 }, { level: 3, slaMinutes: 1 }] })),
  },
}));

vi.mock('../ReviewCaseRepository', () => ({
  ReviewCaseRepository: {
    moveToLevel: vi.fn(async () => {}),
    setDueAt: vi.fn(async () => {}),
  },
}));

describe('review workflow levels', () => {
  it('advances level and sets dueAt', async () => {
    const next = await ReviewWorkflowService.advanceLevel('case-1', 1);
    expect(next).toBe(2);
  });

  it('permission model allows admin', async () => {
    const ok = await ReviewWorkflowService.canAct({ role: 'admin', permissions: [] }, { level: 1, action: 'approve' });
    expect(ok).toBe(true);
  });
});

