import type { TargetType } from './types';

export type InteractionEventType = 'like' | 'unlike' | 'rating' | 'share';

export type InteractionEvent = {
  type: InteractionEventType;
  targetType: TargetType;
  targetId: string;
  userId?: string;
  platform?: string;
  score?: number;
  reasonTags?: string[];
  traceId?: string;
  createdAt: string;
};

export const buildInteractionEvent = (payload: Omit<InteractionEvent, 'createdAt'>): InteractionEvent => {
  return { ...payload, createdAt: new Date().toISOString() };
};

