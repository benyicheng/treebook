import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';

// Ensure JWT_SECRET is set before modules are imported
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
});

vi.mock('../../domains/moderation/ModerationAdminService', () => ({
  ModerationAdminService: {
    getMetrics: vi.fn(),
    listDecisions: vi.fn(),
    manualDecision: vi.fn(),
  },
}));

const getToken = () => {
  return jwt.sign({ id: 'admin-1', email: 'a@b.com', role: 'admin', permissions: [] }, process.env.JWT_SECRET!);
};

const listen = async (app: any) => {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address() as any;
  return { server, baseUrl: `http://127.0.0.1:${addr.port}/api` };
};

describe('moderation routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns metrics for admin', async () => {
    const { ModerationAdminService } = await import('../../domains/moderation/ModerationAdminService');
    (ModerationAdminService.getMetrics as any).mockResolvedValue({ since: 'x', byStatus: [], byProvider: [], byTargetType: [] });

    const router = (await import('../moderation')).default;
    const app = express();
    app.use(express.json());
    app.use('/api/moderation', router);

    const { server, baseUrl } = await listen(app);
    const token = getToken();
    const res = await fetch(`${baseUrl}/moderation/metrics?sinceMinutes=60`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json: any = await res.json();
    server.close();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(ModerationAdminService.getMetrics).toHaveBeenCalled();
  });
});

