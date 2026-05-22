import type { ModerationDecision, ModerationRequest } from '../moderation/types';
import { MediaRepository } from './MediaRepository';

export class MediaModerationHook {
  static async onMachineDecisionRecorded(input: { decision: ModerationDecision; request: ModerationRequest }) {
    if (input.request.targetType !== 'media_asset') return;
    const assetId = input.request.targetId;
    const status = input.decision.status;
    if (status === 'approved') {
      await MediaRepository.setAssetStatus(assetId, 'approved');
      return;
    }
    if (status === 'rejected') {
      await MediaRepository.setAssetStatus(assetId, 'rejected');
      await MediaRepository.addRiskLog({
        assetId,
        kind: 'content_compliance',
        severity: 'high',
        message: 'machine_moderation_rejected',
        payload: { labels: input.decision.labels, reasons: input.decision.reasons, provider: input.decision.provider },
      });
      return;
    }
    if (status === 'failed') {
      await MediaRepository.addRiskLog({
        assetId,
        kind: 'content_compliance',
        severity: 'medium',
        message: 'machine_moderation_failed',
        payload: { labels: input.decision.labels, reasons: input.decision.reasons, provider: input.decision.provider },
      });
    }
  }
}
