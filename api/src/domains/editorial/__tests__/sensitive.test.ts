import { describe, it, expect } from 'vitest';
import { sanitizeSensitive, normalizeText } from '../sensitive';

describe('editorial sensitive', () => {
  it('sanitizes emails and phones', () => {
    const r = sanitizeSensitive('联系我 test@example.com 或 +86 138-0013-8000');
    expect(r.text).toContain('[REDACTED_EMAIL]');
    expect(r.text).toContain('[REDACTED_PHONE]');
    expect(r.hits.length).toBeGreaterThan(0);
  });

  it('normalizes line endings and trims', () => {
    const out = normalizeText('a \r\nb\t \r\n');
    expect(out).toBe('a\nb');
  });
});

