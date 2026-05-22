import type { VirusScanResult, VirusScanner } from './VirusScanner';

export class DisabledVirusScanner implements VirusScanner {
  async scan(_: { buffer: Buffer; mimeType: string; originalName: string }): Promise<VirusScanResult> {
    return { ok: true };
  }
}
