export type VirusScanResult =
  | { ok: true }
  | { ok: false; threats: { kind: string; message: string }[] };

export interface VirusScanner {
  scan(input: { buffer: Buffer; mimeType: string; originalName: string }): Promise<VirusScanResult>;
}
