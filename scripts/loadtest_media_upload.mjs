const baseUrl = process.env.LOADTEST_BASE_URL || 'http://localhost:3001/api';
const token = process.env.LOADTEST_TOKEN || '';
const concurrency = Number(process.env.LOADTEST_CONCURRENCY || 10);
const total = Number(process.env.LOADTEST_TOTAL || 200);

const headers = token ? { Authorization: `Bearer ${token}` } : {};

const makePng = () => {
  const b64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X0uoAAAAASUVORK5CYII=';
  const bin = Buffer.from(b64, 'base64');
  return bin;
};

const uploadOnce = async () => {
  const fd = new FormData();
  const buf = makePng();
  const blob = new Blob([buf], { type: 'image/png' });
  fd.append('file', blob, 'x.png');
  fd.append('purpose', 'loadtest');
  const res = await fetch(`${baseUrl}/media/uploads`, { method: 'POST', headers, body: fd });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || `http_${res.status}`;
    throw new Error(msg);
  }
  return json;
};

const run = async () => {
  const start = Date.now();
  let ok = 0;
  let fail = 0;
  const errs = new Map();

  let idx = 0;
  const worker = async () => {
    for (;;) {
      const cur = idx++;
      if (cur >= total) return;
      try {
        await uploadOnce();
        ok++;
      } catch (e) {
        fail++;
        const k = String(e?.message || 'error');
        errs.set(k, (errs.get(k) || 0) + 1);
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const ms = Date.now() - start;
  const rps = total / (ms / 1000);

  console.log(JSON.stringify({ baseUrl, total, concurrency, ok, fail, durationMs: ms, rps, errors: Object.fromEntries(errs) }, null, 2));
};

run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

