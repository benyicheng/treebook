import { performance } from 'node:perf_hooks';

const baseUrl = process.env.BASE_URL || 'http://localhost:3001/api';
const token = process.env.ADMIN_TOKEN;
const concurrency = Number(process.env.CONCURRENCY || 20);
const durationSec = Number(process.env.DURATION_SEC || 20);

if (!token) {
  console.error('Missing ADMIN_TOKEN');
  process.exit(1);
}

const endAt = Date.now() + durationSec * 1000;
let ok = 0;
let fail = 0;
const latencies = [];

const worker = async () => {
  while (Date.now() < endAt) {
    const t0 = performance.now();
    try {
      const res = await fetch(`${baseUrl}/moderation/metrics?sinceMinutes=60`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const t1 = performance.now();
      latencies.push(t1 - t0);
      if (res.ok) ok += 1;
      else fail += 1;
    } catch {
      const t1 = performance.now();
      latencies.push(t1 - t0);
      fail += 1;
    }
  }
};

await Promise.all(Array.from({ length: concurrency }, () => worker()));

latencies.sort((a, b) => a - b);
const p = (q) => latencies[Math.floor((latencies.length - 1) * q)] || 0;

console.log(JSON.stringify({
  baseUrl,
  concurrency,
  durationSec,
  ok,
  fail,
  rps: (ok + fail) / durationSec,
  p50_ms: Number(p(0.5).toFixed(2)),
  p95_ms: Number(p(0.95).toFixed(2)),
  p99_ms: Number(p(0.99).toFixed(2)),
}));

