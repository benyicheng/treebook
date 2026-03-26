const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001/api';
const email = process.env.ADMIN_EMAIL || 'admin@example.com';
const password = process.env.ADMIN_PASSWORD || 'Admin123!';

const concurrency = Number(process.env.CONCURRENCY || 50);
const totalRequests = Number(process.env.TOTAL_REQUESTS || 500);
const pageSize = Number(process.env.PAGE_SIZE || 20);

const quantile = (arr, q) => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * q)));
  return sorted[idx];
};

const nowMs = () => Number(process.hrtime.bigint() / 1000000n);

const login = async () => {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`login failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.token;
};

const run = async () => {
  const token = await login();
  const latencies = [];
  let ok = 0;
  let fail = 0;

  let nextIndex = 0;
  const worker = async () => {
    while (true) {
      const i = nextIndex++;
      if (i >= totalRequests) return;

      const t0 = nowMs();
      try {
        const res = await fetch(`${baseUrl}/roles?page=1&pageSize=${pageSize}`, {
          headers: { authorization: `Bearer ${token}` },
        });
        const t1 = nowMs();
        latencies.push(t1 - t0);
        if (res.ok) ok += 1;
        else fail += 1;
        await res.arrayBuffer().catch(() => {});
      } catch {
        const t1 = nowMs();
        latencies.push(t1 - t0);
        fail += 1;
      }
    }
  };

  const startedAt = nowMs();
  await Promise.all(Array.from({ length: concurrency }, worker));
  const endedAt = nowMs();
  const durationMs = endedAt - startedAt;

  const p50 = quantile(latencies, 0.5);
  const p95 = quantile(latencies, 0.95);
  const p99 = quantile(latencies, 0.99);
  const rps = (ok + fail) / (durationMs / 1000);

  const report = {
    baseUrl,
    concurrency,
    totalRequests,
    ok,
    fail,
    durationMs,
    rps: Number(rps.toFixed(2)),
    latencyMs: { p50, p95, p99, min: Math.min(...latencies), max: Math.max(...latencies) },
  };

  console.log(JSON.stringify(report, null, 2));
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

