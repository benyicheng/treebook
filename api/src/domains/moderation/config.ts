import { z } from 'zod';

export const moderationConfigSchema = z.object({
  mode: z.enum(['off', 'observe', 'enforce']).default('observe'),
  rollout: z.object({
    enabled: z.boolean().default(false),
    percent: z.number().min(0).max(100).default(0),
    userIds: z.array(z.string()).default([]),
    businessLines: z.array(z.string()).default([]),
  }).default({ enabled: false, percent: 0, userIds: [], businessLines: [] }),
  policy: z.object({
    onProviderError: z.enum(['allow_and_flag', 'reject']).default('allow_and_flag'),
    hardBlockLabels: z.array(z.string()).default(['illegal', 'porn', 'terror', 'fraud']),
    maxTextLength: z.number().min(1).max(200000).default(50000),
  }).default({ onProviderError: 'allow_and_flag', hardBlockLabels: ['illegal', 'porn', 'terror', 'fraud'], maxTextLength: 50000 }),
  providers: z.object({
    text: z.object({
      enabled: z.boolean().default(true),
      timeoutMs: z.number().min(50).max(10000).default(800),
      breaker: z.object({
        failureThreshold: z.number().min(1).max(100).default(5),
        openMs: z.number().min(1000).max(600000).default(30000),
      }).default({ failureThreshold: 5, openMs: 30000 }),
    }).default({ enabled: true, timeoutMs: 800, breaker: { failureThreshold: 5, openMs: 30000 } }),
    media: z.object({
      enabled: z.boolean().default(true),
      timeoutMs: z.number().min(50).max(20000).default(1200),
      breaker: z.object({
        failureThreshold: z.number().min(1).max(100).default(5),
        openMs: z.number().min(1000).max(600000).default(30000),
      }).default({ failureThreshold: 5, openMs: 30000 }),
      urlAllowlist: z.array(z.string()).default([]),
      urlBlocklist: z.array(z.string()).default([]),
    }).default({ enabled: true, timeoutMs: 1200, breaker: { failureThreshold: 5, openMs: 30000 }, urlAllowlist: [], urlBlocklist: [] }),
  }).default({
    text: { enabled: true, timeoutMs: 800, breaker: { failureThreshold: 5, openMs: 30000 } },
    media: { enabled: true, timeoutMs: 1200, breaker: { failureThreshold: 5, openMs: 30000 }, urlAllowlist: [], urlBlocklist: [] },
  }),
});

export type ModerationConfig = z.infer<typeof moderationConfigSchema>;
