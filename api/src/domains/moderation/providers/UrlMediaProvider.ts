import type { ModerationDecision, ModerationRequest } from '../types';

const normalizeHost = (url: string) => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
};

export class UrlMediaProvider {
  readonly name = 'url_media_v1';
  private allowlist: string[];
  private blocklist: string[];

  constructor(opts: { allowlist: string[]; blocklist: string[] }) {
    this.allowlist = opts.allowlist;
    this.blocklist = opts.blocklist;
  }

  async moderate(req: ModerationRequest): Promise<ModerationDecision> {
    const url = req.mediaUrl || '';
    if (!url.trim()) return { status: 'approved', labels: [], reasons: [] };

    const host = normalizeHost(url);
    if (!host) return { status: 'rejected', labels: ['malformed_url'], reasons: ['invalid_url'], provider: this.name };

    if (this.blocklist.some((d) => host === d || host.endsWith(`.${d}`))) {
      return { status: 'rejected', labels: ['blocked_domain'], reasons: [host], provider: this.name };
    }

    if (this.allowlist.length > 0 && !this.allowlist.some((d) => host === d || host.endsWith(`.${d}`))) {
      return { status: 'rejected', labels: ['untrusted_domain'], reasons: [host], provider: this.name };
    }

    return { status: 'approved', labels: [], reasons: [], provider: this.name };
  }
}

