// ── User ────────────────────────────────────────────────
export type UserRole = 'reader' | 'author' | 'editor' | 'admin' | 'moderator';
export const USER_ROLES = ['reader', 'author', 'editor', 'admin', 'moderator'] as const;

// ── Story ───────────────────────────────────────────────
export type StoryStatus = 'ongoing' | 'completed' | 'hiatus' | 'cancelled' | 'paused';
export const STORY_STATUSES = ['ongoing', 'completed', 'hiatus', 'cancelled', 'paused'] as const;

// ── Character ───────────────────────────────────────────
export type CharacterRole = 'protagonist' | 'antagonist' | 'supporting' | 'extra';
export const CHARACTER_ROLES = ['protagonist', 'antagonist', 'supporting', 'extra'] as const;

// ── Character Appearance ────────────────────────────────
export type AppearanceTargetType = 'chapter' | 'branch' | 'spinoff';
export const APPEARANCE_TARGET_TYPES = ['chapter', 'branch', 'spinoff'] as const;

export type AppearanceType = 'appears' | 'main_focus' | 'mention' | 'cameo';
export const APPEARANCE_TYPES = ['appears', 'main_focus', 'mention', 'cameo'] as const;

// ── Chapter ─────────────────────────────────────────────
export type NodeCategory = 'chapter' | 'branch' | 'spinoff';
export const NODE_CATEGORIES = ['chapter', 'branch', 'spinoff'] as const;

// ── Branch ──────────────────────────────────────────────
export type BranchType = 'parallel' | 'alternate' | 'what_if' | 'timeline';
export const BRANCH_TYPES = ['parallel', 'alternate', 'what_if', 'timeline'] as const;

export type BranchStatus = 'ongoing' | 'completed' | 'merged';
export const BRANCH_STATUSES = ['ongoing', 'completed', 'merged'] as const;

// ── Spinoff ─────────────────────────────────────────────
export type SpinoffType = 'if_timeline' | 'biography' | 'world_expansion';
export const SPINOFF_TYPES = ['if_timeline', 'biography', 'world_expansion'] as const;

export type SpinoffStatus = 'ongoing' | 'completed' | 'merged';
export const SPINOFF_STATUSES = ['ongoing', 'completed', 'merged'] as const;

// ── Merge Request ───────────────────────────────────────
export type MergeRequestType = 'branch_merge' | 'spinoff_merge';
export const MERGE_REQUEST_TYPES = ['branch_merge', 'spinoff_merge'] as const;

export type MergeRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export const MERGE_REQUEST_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'] as const;

// ── Collaboration ───────────────────────────────────────
export type CollaborationRole = 'editor' | 'contributor' | 'consultant';
export const COLLABORATION_ROLES = ['editor', 'contributor', 'consultant'] as const;

export type CollaborationStatus = 'pending' | 'accepted' | 'rejected' | 'removed';
export const COLLABORATION_STATUSES = ['pending', 'accepted', 'rejected', 'removed'] as const;

// ── Reading Progress ────────────────────────────────────
export type ReadingProgressStatus = 'reading' | 'completed' | 'paused' | 'dropped';
export const READING_PROGRESS_STATUSES = ['reading', 'completed', 'paused', 'dropped'] as const;

export type ReadingProgressSource = 'booklist' | 'readingpath' | 'wiki';
export const READING_PROGRESS_SOURCES = ['booklist', 'readingpath', 'wiki'] as const;

// ── Wiki ────────────────────────────────────────────────
export type WikiContentType = 'character' | 'setting' | 'event' | 'concept' | 'faction' | 'item';
export const WIKI_CONTENT_TYPES = ['character', 'setting', 'event', 'concept', 'faction', 'item'] as const;

export type WikiPageStatus = 'draft' | 'published' | 'archived';
export const WIKI_PAGE_STATUSES = ['draft', 'published', 'archived'] as const;

// ── Reading Path ────────────────────────────────────────
export type ReadingPathOrigin = 'author' | 'community' | 'system';
export const READING_PATH_ORIGINS = ['author', 'community', 'system'] as const;

export type ReadingPathStatus = 'draft' | 'published';
export const READING_PATH_STATUSES = ['draft', 'published'] as const;

// ── Booklist ────────────────────────────────────────────
export type BooklistType = 'COLLECTION' | 'TIMELINE';
export const BOOKLIST_TYPES = ['COLLECTION', 'TIMELINE'] as const;

export type BooklistTargetType = 'story' | 'branch' | 'spinoff' | 'chapter' | 'character' | 'wiki_page';
export const BOOKLIST_TARGET_TYPES = ['story', 'branch', 'spinoff', 'chapter', 'character', 'wiki_page'] as const;

export type BooklistStoryLinkRelation = 'featured' | 'referenced' | 'comparison';
export const BOOKLIST_STORY_LINK_RELATIONS = ['featured', 'referenced', 'comparison'] as const;

export type BooklistItemRelationType =
  | 'SAME_CHARACTER'
  | 'ALTERNATE_INTERPRETATION'
  | 'SHARED_UNIVERSE'
  | 'TIMELINE_FORK'
  | 'PARALLEL_EVENT'
  | 'PRECEDING_EVENT'
  | 'CHARACTER_CAMEO'
  | 'BACKGROUND_REFERENCE';
export const BOOKLIST_ITEM_RELATION_TYPES = [
  'SAME_CHARACTER',
  'ALTERNATE_INTERPRETATION',
  'SHARED_UNIVERSE',
  'TIMELINE_FORK',
  'PARALLEL_EVENT',
  'PRECEDING_EVENT',
  'CHARACTER_CAMEO',
  'BACKGROUND_REFERENCE',
] as const;

// ── StoryEvent ──────────────────────────────────────────
export type StoryEventType =
  | 'main_arc'
  | 'side_story'
  | 'character_event'
  | 'world_event'
  | 'climax'
  | 'turning_point'
  | 'flashback'
  | 'foreshadowing';
export const STORY_EVENT_TYPES = [
  'main_arc',
  'side_story',
  'character_event',
  'world_event',
  'climax',
  'turning_point',
  'flashback',
  'foreshadowing',
] as const;

export type StoryEventNodeType = 'chapter' | 'branch' | 'spinoff';
export const STORY_EVENT_NODE_TYPES = ['chapter', 'branch', 'spinoff'] as const;

// ── Activity ────────────────────────────────────────────
export type ActivityType = 'story_publish' | 'branch_create' | 'spinoff_publish' | 'chapter_update' | 'merge_request' | 'merge_approved';
export const ACTIVITY_TYPES = ['story_publish', 'branch_create', 'spinoff_publish', 'chapter_update', 'merge_request', 'merge_approved'] as const;

export type ActivityTargetType = 'story' | 'branch' | 'spinoff' | 'chapter';
export const ACTIVITY_TARGET_TYPES = ['story', 'branch', 'spinoff', 'chapter'] as const;

// ── Notification ────────────────────────────────────────
export type NotificationType = 'comment_reply' | 'branch_created' | 'merge_requested' | 'merge_approved';
export const NOTIFICATION_TYPES = ['comment_reply', 'branch_created', 'merge_requested', 'merge_approved'] as const;

export type NotificationTargetType = 'comment' | 'branch' | 'merge_request';
export const NOTIFICATION_TARGET_TYPES = ['comment', 'branch', 'merge_request'] as const;

// ── Transaction ─────────────────────────────────────────
export type TransactionType = 'REVENUE_SHARE' | 'WITHDRAWAL' | 'RECHARGE';
export const TRANSACTION_TYPES = ['REVENUE_SHARE', 'WITHDRAWAL', 'RECHARGE'] as const;

export type TransactionTargetType = 'STORY' | 'BRANCH';
export const TRANSACTION_TARGET_TYPES = ['STORY', 'BRANCH'] as const;

// ── Wallet ──────────────────────────────────────────────
export type Currency = 'UNIV';
export const CURRENCIES = ['UNIV'] as const;

// ── Wiki Link ───────────────────────────────────────────
export type WikiLinkType = 'reference' | 'see_also' | 'parent' | 'child' | 'related';
export const WIKI_LINK_TYPES = ['reference', 'see_also', 'parent', 'child', 'related'] as const;

// ── Media ───────────────────────────────────────────────
export type MediaAssetStatus = 'uploading' | 'ready' | 'failed' | 'deleted';
export const MEDIA_ASSET_STATUSES = ['uploading', 'ready', 'failed', 'deleted'] as const;

// ── Moderation ──────────────────────────────────────────
export type ModerationJobStatus = 'pending' | 'running' | 'completed' | 'failed';
export const MODERATION_JOB_STATUSES = ['pending', 'running', 'completed', 'failed'] as const;
