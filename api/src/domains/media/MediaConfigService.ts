import { isMediaDegraded } from './degrade';

export class MediaConfigService {
  static getConfig() {
    const enabled = (process.env.MEDIA_UPLOADS_ENABLED || '').toLowerCase() === 'true';
    const maxImageBytes = Number(process.env.MEDIA_MAX_IMAGE_BYTES || 2 * 1024 * 1024);
    const maxAudioBytes = Number(process.env.MEDIA_MAX_AUDIO_BYTES || 5 * 1024 * 1024);
    const maxVideoBytes = Number(process.env.MEDIA_MAX_VIDEO_BYTES || 50 * 1024 * 1024);
    const scanMode = (process.env.MEDIA_VIRUS_SCAN_MODE || 'mock').toLowerCase();
    const quarantineDir = process.env.MEDIA_QUARANTINE_DIR || 'uploads/quarantine';
    const rolloutPercent = Math.max(0, Math.min(100, Number(process.env.MEDIA_ROLLOUT_PERCENT || 100)));
    return { enabled: enabled && !isMediaDegraded(), rolloutPercent, maxImageBytes, maxAudioBytes, maxVideoBytes, scanMode, quarantineDir };
  }
}
