export type ModerationContentType = 'text' | 'image' | 'audio' | 'video';

export type ModerationDecisionStatus = 'pending' | 'approved' | 'rejected' | 'failed';

export type ModerationTargetType =
  | 'story'
  | 'chapter'
  | 'comment'
  | 'spinoff'
  | 'booklist'
  | 'booklist_item'
  | 'user'
  | 'character'
  | 'ai_asset'
  | 'media_asset';

export type ModerationRequest = {
  businessLine: string;
  targetType: ModerationTargetType;
  targetId: string;
  contentType: ModerationContentType;
  field?: string;
  text?: string;
  mediaUrl?: string;
  userId?: string;
  traceId?: string;
  createdAt: string;
};

export type ModerationDecision = {
  status: ModerationDecisionStatus;
  labels: string[];
  reasons: string[];
  score?: number;
  provider?: string;
};
