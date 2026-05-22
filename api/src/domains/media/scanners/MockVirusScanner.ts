import type { VirusScanner, VirusScanResult } from './VirusScanner';

const hasPrefix = (buf: Buffer, prefix: number[]) => {
  if (buf.length < prefix.length) return false;
  for (let i = 0; i < prefix.length; i++) {
    if (buf[i] !== prefix[i]) return false;
  }
  return true;
};

const looksLikeMime = (buf: Buffer, mimeType: string) => {
  if (mimeType === 'image/png') return hasPrefix(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (mimeType === 'image/jpeg') return hasPrefix(buf, [0xff, 0xd8, 0xff]);
  if (mimeType === 'image/webp') return buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP';
  if (mimeType === 'audio/mpeg') return hasPrefix(buf, [0x49, 0x44, 0x33]) || hasPrefix(buf, [0xff, 0xfb]) || hasPrefix(buf, [0xff, 0xf3]) || hasPrefix(buf, [0xff, 0xf2]);
  if (mimeType === 'audio/wav') return buf.length > 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WAVE';
  if (mimeType === 'video/mp4') return buf.length > 12 && buf.toString('ascii', 4, 8) === 'ftyp';
  return true;
};

export class MockVirusScanner implements VirusScanner {
  async scan(input: { buffer: Buffer; mimeType: string; originalName: string }): Promise<VirusScanResult> {
    const threats: { kind: string; message: string }[] = [];

    const ascii = input.buffer.toString('ascii');
    if (ascii.includes('EICAR-STANDARD-ANTIVIRUS-TEST-FILE')) {
      threats.push({ kind: 'eicar', message: 'EICAR test signature detected' });
    }

    if (!looksLikeMime(input.buffer, input.mimeType)) {
      threats.push({ kind: 'mime_mismatch', message: 'File signature does not match declared mimeType' });
    }

    if (threats.length > 0) return { ok: false, threats };
    return { ok: true };
  }
}
