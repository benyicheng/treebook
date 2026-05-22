import crypto from 'crypto';
import { ModerationConfigService } from '../domains/moderation/ModerationConfigService';
import { ModerationJobRepository } from '../domains/moderation/ModerationJobRepository';
import { ModerationOrchestrator } from '../domains/moderation/ModerationOrchestrator';
import { ReviewWorkflowService } from '../domains/reviewWorkflow/ReviewWorkflowService';
import { MediaModerationHook } from '../domains/media/MediaModerationHook';
import type { ModerationRequest } from '../domains/moderation/types';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const backoffMs = (attempts: number) => {
  const base = Math.min(60_000, 1000 * Math.pow(2, Math.min(10, attempts)));
  const jitter = Math.floor(Math.random() * 200);
  return base + jitter;
};

const safeParse = (raw: string): ModerationRequest | null => {
  try {
    return JSON.parse(raw) as ModerationRequest;
  } catch {
    return null;
  }
};

export const runModerationWorker = async (opts?: { once?: boolean; batchSize?: number; intervalMs?: number }) => {
  const once = !!opts?.once;
  const batchSize = opts?.batchSize ?? Number(process.env.MODERATION_WORKER_BATCH_SIZE || 20);
  const intervalMs = opts?.intervalMs ?? Number(process.env.MODERATION_WORKER_INTERVAL_MS || 1000);
  const workerId = process.env.MODERATION_WORKER_ID || crypto.randomUUID();

  for (;;) {
    const cfg = await ModerationConfigService.getConfig();
    if (cfg.mode === 'off') {
      if (once) return;
      await sleep(intervalMs);
      continue;
    }

    let jobs: any[] = [];
    try {
      jobs = await ModerationJobRepository.claimBatch(workerId, batchSize);
    } catch {
      if (once) return;
      await sleep(intervalMs);
      continue;
    }

    if (jobs.length === 0) {
      if (once) return;
      await sleep(intervalMs);
      continue;
    }

    const orchestrator = new ModerationOrchestrator(cfg);
    for (const job of jobs) {
      const req = safeParse(job.request);
      if (!req) {
        try {
          await ModerationJobRepository.markDead(job.id, 'invalid_request_json');
        } catch {}
        continue;
      }

      try {
        const decision = await orchestrator.moderate(req);
        const { decisionId } = await ModerationJobRepository.markDone(job.id, decision, req);
        try {
          await ReviewWorkflowService.onMachineDecisionRecorded({ decisionId, decision, request: req });
        } catch {}
        try {
          await MediaModerationHook.onMachineDecisionRecorded({ decision, request: req });
        } catch {}
      } catch (e: any) {
        const attempts = (job.attempts || 0) + 1;
        const errMsg = String(e?.message || 'worker_error').slice(0, 500);
        if (attempts >= 10) {
          try {
            await ModerationJobRepository.markDead(job.id, errMsg);
          } catch {}
          continue;
        }
        const nextRunAt = new Date(Date.now() + backoffMs(attempts)).toISOString();
        try {
          await ModerationJobRepository.markFailed(job.id, errMsg, attempts, nextRunAt);
        } catch {}
      }
    }

    if (once) return;
  }
};

if (process.argv.includes('--once')) {
  runModerationWorker({ once: true }).catch(() => process.exitCode = 1);
}
