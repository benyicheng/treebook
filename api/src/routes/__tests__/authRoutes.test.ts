import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import express from 'express';
import http from 'http';

// Ensure JWT_SECRET is set before route modules are imported
beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
});

// Mock prisma before importing routes that depend on it
vi.mock('../../prisma', () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
    userRole: {
      create: vi.fn(),
    },
  },
}));

const makeApp = async () => {
  const { default: authRoutes } = await import('../auth');
  const { errorHandler } = await import('../../middleware/errorHandler');
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  return app;
};

const listen = async (app: ReturnType<typeof express>) => {
  const server = http.createServer(app);
  await new Promise<void>((r) => server.listen(0, r));
  const addr = server.address() as { port: number };
  return { server, baseUrl: `http://127.0.0.1:${addr.port}/api/auth` };
};

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 for missing body fields', async () => {
    const app = await makeApp();
    const { server, baseUrl } = await listen(app);
    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    server.close();
    expect(res.status).toBe(400);
    const json: any = await res.json();
    expect(json.success).toBe(false);
  });

  it('returns 401 for unknown email', async () => {
    const { prisma } = await import('../../prisma');
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const app = await makeApp();
    const { server, baseUrl } = await listen(app);
    const res = await fetch(`${baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@example.com', password: 'wrong' }),
    });
    server.close();
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 409 when user already exists', async () => {
    const { prisma } = await import('../../prisma');
    (prisma.user.findFirst as any).mockResolvedValue({ id: 'existing-user' });

    const app = await makeApp();
    const { server, baseUrl } = await listen(app);
    const res = await fetch(`${baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'taken@example.com', username: 'taken', password: 'password123' }),
    });
    server.close();
    expect(res.status).toBe(400);
    const json: any = await res.json();
    expect(json.success).toBe(false);
  });
});
