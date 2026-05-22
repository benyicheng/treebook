import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class MediaStorageService {
  static async saveToQuarantine(input: { buffer: Buffer; originalName: string; quarantineDir: string }) {
    const ext = path.extname(input.originalName);
    const id = crypto.randomUUID();
    const fileName = `${id}${ext}`;
    const rel = path.join(input.quarantineDir, fileName);
    const abs = path.join(process.cwd(), rel);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, input.buffer);
    return { storagePath: rel.replace(/\\/g, '/'), fileName };
  }

  static async readAbsolute(storagePath: string) {
    return path.join(process.cwd(), storagePath);
  }
}
