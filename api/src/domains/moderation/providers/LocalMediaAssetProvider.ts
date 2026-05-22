import fs from 'fs/promises';
import path from 'path';
import type { ModerationDecision, ModerationRequest } from '../types';

export class LocalMediaAssetProvider {
  readonly name = 'local_media_asset_v1';

  async moderate(req: ModerationRequest): Promise<ModerationDecision> {
    const rel = (req.mediaUrl || '').trim();
    if (!rel) return { status: 'rejected', labels: ['missing_path'], reasons: ['empty_mediaUrl'], provider: this.name };

    const abs = path.join(process.cwd(), rel);
    try {
      const st = await fs.stat(abs);
      if (!st.isFile()) return { status: 'rejected', labels: ['not_a_file'], reasons: [rel], provider: this.name };
      return { status: 'approved', labels: [], reasons: [], provider: this.name };
    } catch {
      return { status: 'rejected', labels: ['missing_file'], reasons: [rel], provider: this.name };
    }
  }
}
