const PHONE_RE = /(\+?\d[\d\s-]{7,}\d)/g;
const EMAIL_RE = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

export const sanitizeSensitive = (text: string) => {
  const hits: { kind: string; value: string }[] = [];
  let out = text;

  out = out.replace(EMAIL_RE, (m) => {
    hits.push({ kind: 'email', value: m });
    return '[REDACTED_EMAIL]';
  });

  out = out.replace(PHONE_RE, (m) => {
    hits.push({ kind: 'phone', value: m });
    return '[REDACTED_PHONE]';
  });

  return { text: out, hits };
};

export const normalizeText = (text: string) => {
  const out = text.replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trimEnd();
  return out;
};
