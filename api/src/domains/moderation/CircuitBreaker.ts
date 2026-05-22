export type CircuitState = 'closed' | 'open';

export class CircuitBreaker {
  private failureThreshold: number;
  private openMs: number;
  private failures = 0;
  private openUntil = 0;

  constructor(opts: { failureThreshold: number; openMs: number }) {
    this.failureThreshold = opts.failureThreshold;
    this.openMs = opts.openMs;
  }

  canRequest() {
    if (this.openUntil <= 0) return true;
    if (Date.now() >= this.openUntil) {
      this.openUntil = 0;
      this.failures = 0;
      return true;
    }
    return false;
  }

  onSuccess() {
    this.failures = 0;
    this.openUntil = 0;
  }

  onFailure() {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.openUntil = Date.now() + this.openMs;
    }
  }

  state(): CircuitState {
    return this.canRequest() ? 'closed' : 'open';
  }
}

