import type { ModerationConfig } from './config';
import { CircuitBreaker } from './CircuitBreaker';
import { withTimeout } from './withTimeout';
import type { ModerationDecision, ModerationRequest } from './types';
import { TextRuleProvider } from './providers/TextRuleProvider';
import { UrlMediaProvider } from './providers/UrlMediaProvider';
import { LocalMediaAssetProvider } from './providers/LocalMediaAssetProvider';

export class ModerationOrchestrator {
  private cfg: ModerationConfig;
  private textProvider: TextRuleProvider;
  private mediaProvider: UrlMediaProvider;
  private localMediaAssetProvider: LocalMediaAssetProvider;
  private textBreaker: CircuitBreaker;
  private mediaBreaker: CircuitBreaker;

  constructor(cfg: ModerationConfig) {
    this.cfg = cfg;
    this.textProvider = new TextRuleProvider();
    this.mediaProvider = new UrlMediaProvider({
      allowlist: cfg.providers.media.urlAllowlist,
      blocklist: cfg.providers.media.urlBlocklist,
    });
    this.localMediaAssetProvider = new LocalMediaAssetProvider();
    this.textBreaker = new CircuitBreaker(cfg.providers.text.breaker);
    this.mediaBreaker = new CircuitBreaker(cfg.providers.media.breaker);
  }

  async moderate(req: ModerationRequest): Promise<ModerationDecision> {
    if (req.contentType === 'text') return this.moderateText(req);
    return this.moderateMedia(req);
  }

  private async moderateText(req: ModerationRequest): Promise<ModerationDecision> {
    if (!this.cfg.providers.text.enabled) return { status: 'approved', labels: [], reasons: [], provider: 'disabled' };
    if (!this.textBreaker.canRequest()) return this.onProviderUnavailable('text_breaker_open');

    const text = (req.text || '').slice(0, this.cfg.policy.maxTextLength);
    const clippedReq: ModerationRequest = { ...req, text };

    try {
      const res = await withTimeout(this.textProvider.moderate(clippedReq), this.cfg.providers.text.timeoutMs);
      this.textBreaker.onSuccess();
      return res;
    } catch (e: any) {
      this.textBreaker.onFailure();
      return this.onProviderError(e?.message || 'text_provider_error');
    }
  }

  private async moderateMedia(req: ModerationRequest): Promise<ModerationDecision> {
    if (req.targetType === 'media_asset') {
      try {
        return await withTimeout(this.localMediaAssetProvider.moderate(req), this.cfg.providers.media.timeoutMs);
      } catch (e: any) {
        return this.onProviderError(e?.message || 'local_media_asset_error');
      }
    }

    if (!this.cfg.providers.media.enabled) return { status: 'approved', labels: [], reasons: [], provider: 'disabled' };
    if (!this.mediaBreaker.canRequest()) return this.onProviderUnavailable('media_breaker_open');

    try {
      const res = await withTimeout(this.mediaProvider.moderate(req), this.cfg.providers.media.timeoutMs);
      this.mediaBreaker.onSuccess();
      return res;
    } catch (e: any) {
      this.mediaBreaker.onFailure();
      return this.onProviderError(e?.message || 'media_provider_error');
    }
  }

  private onProviderUnavailable(reason: string): ModerationDecision {
    if (this.cfg.policy.onProviderError === 'reject' && this.cfg.mode === 'enforce') {
      return { status: 'rejected', labels: ['provider_unavailable'], reasons: [reason], score: 1, provider: 'unavailable' };
    }
    return { status: 'failed', labels: ['provider_unavailable'], reasons: [reason], score: 0, provider: 'unavailable' };
  }

  private onProviderError(reason: string): ModerationDecision {
    if (this.cfg.policy.onProviderError === 'reject' && this.cfg.mode === 'enforce') {
      return { status: 'rejected', labels: ['provider_error'], reasons: [reason], score: 1, provider: 'error' };
    }
    return { status: 'failed', labels: ['provider_error'], reasons: [reason], score: 0, provider: 'error' };
  }
}
