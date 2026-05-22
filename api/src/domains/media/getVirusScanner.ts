import { MediaConfigService } from './MediaConfigService';
import { DisabledVirusScanner } from './scanners/DisabledVirusScanner';
import { MockVirusScanner } from './scanners/MockVirusScanner';
import type { VirusScanner } from './scanners/VirusScanner';

export const getVirusScanner = (): VirusScanner => {
  const cfg = MediaConfigService.getConfig();
  if (cfg.scanMode === 'off' || cfg.scanMode === 'disabled' || cfg.scanMode === 'none') return new DisabledVirusScanner();
  return new MockVirusScanner();
};
