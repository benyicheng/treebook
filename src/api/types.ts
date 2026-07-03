// ── 通用 API 响应 ──
export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  items?: T[];
  total?: number;
  page?: number;
  limit?: number;
  nextCursor?: string | null;
}

// ── 用户 ──
export interface UserBrief {
  id: string;
  username: string;
  avatarUrl?: string | null;
  role?: string;
}

// ── Story ──
export interface Story {
  id: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  authorId: string;
  isOfficial?: boolean;
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled' | 'paused';
  viewCount?: number;
  branchCount?: number;
  createdAt: string;
  updatedAt: string;
  author?: UserBrief;
  tags?: { id: string; name: string }[];
  _count?: {
    branches: number;
    chapters: number;
  };
  spinoffs?: Spinoff[];
}

// ── Spinoff ──
export interface Spinoff {
  id: string;
  authorId: string;
  originalStoryId: string;
  originalBranchId?: string;
  originalChapterId?: string;
  originalEventId?: string | null;
  title: string;
  summary?: string;
  content: string;
  type: 'biography' | 'if_timeline' | 'world_expansion';
  status: 'ongoing' | 'completed' | 'merged';
  isOfficial: boolean;
  revenueShareRate: number;
  referencedCharacters?: string;
  characterRelationships?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author?: UserBrief;
  originalStory?: {
    title: string;
    authorId: string;
    description?: string;
    coverImage?: string;
    status?: string;
    author?: { username: string };
    tags?: { id: string; name: string }[] | string;
  };
  originalBranch?: {
    title: string;
    description?: string;
  };
  originalChapter?: {
    id: string;
    title: string;
    orderIndex: number;
  };
  characters?: Pick<Character, 'id' | 'name' | 'role' | 'avatarUrl'>[];
}

// ── Character ──
export interface Character {
  id: string;
  storyId: string;
  name: string;
  description?: string | null;
  avatarUrl?: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'extra';
  attributes?: Record<string, unknown>;
}

// ── Branch ──
export interface Branch {
  id: string;
  parentStoryId: string;
  parentChapterId: string;
  parentEventId?: string | null;
  parentBranchId?: string;
  authorId: string;
  title: string;
  description?: string | null;
  branchType: string;
  isOfficial: boolean;
  isCertified?: boolean;
  treeDepth?: number;
  status?: 'ongoing' | 'completed' | 'merged';
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
  author?: UserBrief;
  parentStory?: Story & { spinoffs?: Spinoff[] };
  parentChapter?: {
    id: string;
    title: string;
    orderIndex: number;
  };
  _count?: {
    chapters: number;
  };
}

// ── Chapter ──
export interface Chapter {
  id: string;
  storyId: string;
  branchId?: string;
  title: string;
  content: string;
  orderIndex: number;
  isBranchPoint: boolean;
  createdAt: string;
}

export interface ChapterExtended extends Chapter {
  status?: string;
  viewCount?: number;
  commentCount?: number;
  subtitle?: string;
  tags?: string[];
  author?: UserBrief;
  prevChapter?: { id: string; title: string };
  nextChapter?: { id: string; title: string };
  story?: { id: string; title: string; author?: UserBrief };
  branchesFrom?: Branch[];
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  chapterId: string;
  createdAt: string;
  author: {
    username: string;
    avatarUrl?: string;
    role: string;
  };
}

// ── Booklist ──
export interface BooklistItem {
  id: string;
  targetType: 'chapter' | 'branch' | 'spinoff' | 'story' | 'event' | 'wiki';
  targetId: string;
  chapterId?: string;
  notes?: string;
  orderIndex?: number;
  section?: string;
  storyId?: string;
  parentItemId?: string;
  chapter?: {
    id: string;
    title: string;
    orderIndex: number;
    story?: { id: string; title: string; author?: UserBrief };
    branch?: { id: string; title: string };
  };
  story?: { id: string; title: string; coverImage?: string; viewCount?: number; author?: UserBrief };
  branch?: {
    id: string; title: string; status?: string; branchType?: string; viewCount?: number; isOfficial?: boolean;
    author?: UserBrief;
    parentStory?: { id: string; title: string; author?: UserBrief };
  };
  spinoff?: {
    id: string; title: string; summary?: string; type?: string; status?: string; viewCount?: number;
    author?: UserBrief;
    originalStory?: { id: string; title: string; author?: UserBrief };
  };
  event?: {
    id: string; title: string; description?: string; type?: string; color?: string; importance?: number;
    story?: { id: string; title: string };
  };
  wikiPage?: {
    id: string; title: string; summary?: string; contentType?: string;
    story?: { id: string; title: string };
  };
}

export interface Booklist {
  id: string;
  creatorId: string;
  title: string;
  description: string;
  content?: string;
  coverImage?: string;
  type?: string;
  isPublic: boolean;
  viewCount?: number;
  likesCount?: number;
  totalEarnings?: number;
  tags?: { id: string; name: string }[] | string;
  createdAt: string;
  updatedAt: string;
  creator?: UserBrief;
  _count?: { items: number };
  items?: BooklistItem[];
  itemsBySection?: Record<string, BooklistItem[]>;
  itemsByStory?: {
    storyId: string;
    story?: { id: string; title: string; coverImage?: string; author?: UserBrief };
    items: BooklistItem[];
    events: BooklistItem[];
    children: BooklistItem[];
  }[];
  ungroupedItems?: BooklistItem[];
  paths?: ReadingPath[];
}

// ── ReadingPath ──
export interface ReadingPathNode {
  nodeCategory: 'chapter' | 'branch' | 'spinoff' | 'story' | 'character' | 'wiki_page';
  contentId: string;
  title: string;
  introduction?: string;
  note?: string;
  sortOrder: number;
  storyId?: string;
  storyTitle?: string;
}

export interface ReadingPath {
  id: string;
  title: string;
  description?: string;
  guideType?: string;
  booklistId?: string;
  storyId?: string;
  origin?: string;
  viewCount?: number;
  startCount?: number;
  completionCount?: number;
  creator?: UserBrief;
  nodes: ReadingPathNode[];
  _count?: { nodes: number };
  createdAt: string;
  updatedAt: string;
}

export interface Trail {
  id: string;
  pathId: string;
  path: ReadingPath;
  currentNodeIndex: number;
  completedNodeIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Interaction ──
export interface InteractionStats {
  targetType: string;
  targetId: string;
  likeCount: number;
  shareCount: number;
  ratingCount: number;
  ratingAvg: number;
  ratingDist: Record<string, number>;
  liked: boolean;
  viewCount?: number;
  myRating: number | null;
  myReasonTags: string[];
}

export interface LikeResponse {
  liked: boolean;
  likeCount: number;
  fraudCheck?: { warning: boolean; confidence: number };
}

export interface ShareResponse {
  shareCount: number;
}

export interface RatingRequest {
  score: number;
  reasonTags?: string[];
}

export type SharePlatform = 'wechat' | 'weibo' | 'qq' | 'copy' | 'twitter' | 'facebook';
export type TargetType = 'story' | 'chapter' | 'booklist' | 'spinoff' | 'event';

export interface ShareConfig {
  platform: SharePlatform;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
}

// ── Wiki ──
export interface WikiLink {
  id: string;
  sourcePageId: string;
  targetPageId: string;
  linkType: string;
  createdAt: string;
}

export interface WikiAlias {
  id: string;
  wikiPageId: string;
  alias: string;
  language: string | null;
}

export interface WikiPage {
  id: string;
  storyId: string | null;
  title: string;
  slug: string;
  contentType: 'character' | 'setting' | 'event' | 'concept' | 'faction' | 'item';
  content: string;
  summary: string | null;
  attributes: Record<string, unknown> | null;
  status: 'draft' | 'published' | 'archived';
  version: number;
  createdBy: string;
  updatedAt: string;
  createdAt: string;
  creator?: UserBrief;
  aliases?: WikiAlias[];
  outgoingLinks?: WikiLink[];
  incomingLinks?: WikiLink[];
  story?: { id: string; title: string } | null;
  _count?: { outgoingLinks: number; incomingLinks: number };
}

// ── StoryEvent ──
export interface StoryEventNode {
  id: string;
  eventId: string;
  targetType: 'chapter' | 'branch' | 'spinoff';
  targetId: string;
  sortOrder: number;
  note?: string;
}

export interface StoryEvent {
  id: string;
  storyId: string;
  title: string;
  description?: string;
  type: string;
  importance: number;
  color?: string;
  sortOrder: number;
  storyTime?: number | null;
  nodes: StoryEventNode[];
  createdAt: string;
  updatedAt: string;
}

export interface EventComment {
  id: string;
  content: string;
  userId: string;
  eventId: string;
  parentId?: string;
  user: UserBrief;
  createdAt: string;
}

// ── Search ──
export interface SearchResultItem {
  title: string;
  type: 'story' | 'chapter' | 'branch' | 'spinoff' | 'author';
  sourceId: string;
  highlight: string;
  metadata: {
    storyId?: string;
    authorId?: string;
    branchId?: string;
  };
  rank: number;
}

export interface SearchResult {
  results: SearchResultItem[];
  total: number;
  query: string;
  type: string | null;
}

export interface SearchSuggestItem {
  title: string;
  type: 'story' | 'chapter' | 'branch' | 'spinoff' | 'author';
  sourceId: string;
}

// ── Notification ──
export interface NotificationItem {
  id: string;
  userId: string;
  actorId?: string;
  type: string;
  targetType: string;
  targetId: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ── Activity ──
export interface ActivityItem {
  id: string;
  actorId: string;
  actor: UserBrief;
  type: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface FollowActivityItem {
  id: string;
  type: 'story' | 'branch' | 'spinoff';
  title: string;
  description: string;
  storyId?: string;
  author: UserBrief | null;
  createdAt: string;
  viewCount?: number;
  likeCount?: number;
}

// ── Editorial ──
export interface EditorialChange {
  id: string;
  targetType: string;
  targetId: string;
  field: string;
  status: string;
  original: string | null;
  proposed: string;
  appliedBy: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EditorialChangeAction {
  id: string;
  changeId: string;
  action: string;
  actorUserId: string | null;
  payload: string | null;
  createdAt: string;
}

export type EditorialChangeDetail = EditorialChange & { actions: EditorialChangeAction[] };

// ── Moderation ──
export interface ModerationMetrics {
  since: string;
  byStatus: Array<{ status: string; count: number }>;
  byProvider: Array<{ provider: string; count: number }>;
  byTargetType: Array<{ targetType: string; count: number }>;
}

export interface ModerationDecision {
  id: string;
  jobId: string;
  businessLine: string;
  targetType: string;
  targetId: string;
  contentType: string;
  field?: string;
  status: 'pending' | 'approved' | 'rejected' | 'failed';
  labels?: string;
  reasons?: string;
  score?: number;
  provider?: string;
  traceId?: string;
  createdAt: string;
}

// ── Role / Permission ──
export interface Permission {
  id: string;
  code: string;
  description: string;
}

export interface RoleItem {
  id: string;
  name: string;
  description?: string;
  permissions?: { permission: Permission }[];
  _count: { users: number; permissions?: number };
}

export interface UserWithRoles {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  profile: unknown | null;
  followerCount: number;
  followingCount: number;
  createdAt: string;
  roles: {
    roleId: string;
    role: { id: string; name: string };
  }[];
}

// ── ReviewWorkflow ──
export interface ReviewCase {
  id: string;
  businessLine: string;
  targetType: string;
  targetId: string;
  contentType: string;
  field: string | null;
  status: string;
  level: number;
  assigneeUserId: string | null;
  sourceDecisionId: string | null;
  snapshot: string | null;
  dueAt?: string | null;
  reopenedCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewCaseAction {
  id: string;
  caseId: string;
  action: string;
  actorUserId: string | null;
  payload: string | null;
  createdAt: string;
}

export type ReviewCaseDetail = ReviewCase & { actions: ReviewCaseAction[] };

// ── Media ──
export interface UploadedMedia {
  id: string;
  kind: 'image' | 'audio' | 'video';
  mimeType: string;
  sizeBytes: number;
  url: string;
  status: string;
  resolvedUrl: string;
}

// ── Reading Progress ──
export interface ReadingProgress {
  chapterId: string;
  status: 'reading' | 'completed';
  progress: number;
  currentPage: number | null;
  source: string | null;
  sourceId: string | null;
  updatedAt: string;
}

export interface ReadingStats {
  total: number;
  completed: number;
  inProgress: number;
}

// ── Discover ──
export interface UniverseFeedItem {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  author: UserBrief;
  branchCount: number;
  chapterCount: number;
  spinoffCount: number;
  readingPathCount: number;
  activeReaders: number;
  hotPathsCount: number;
  createdAt: string;
}

// ── Event Connectors ──
export interface ConnectorSummary<T> {
  count: number;
  preview: T[];
}

export interface ChapterPreview {
  id: string;
  title: string;
  orderIndex: number | null;
  storyId: string | null;
  branchId: string | null;
}

export interface CharacterPreview {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  appearanceType: string;
}

export interface WikiPreview {
  id: string;
  title: string;
  contentType: string;
}

export interface BranchPreview {
  id: string;
  title: string;
  branchType: string;
  chapterCount: number;
}

export interface SpinoffPreview {
  id: string;
  title: string;
  type: string;
  isOfficial: boolean;
}

export interface ReadingPathPreview {
  id: string;
  title: string;
  origin: string;
}

export interface EventConnectors {
  chapters: ConnectorSummary<ChapterPreview>;
  characters: ConnectorSummary<CharacterPreview>;
  wiki: ConnectorSummary<WikiPreview>;
  branches: ConnectorSummary<BranchPreview>;
  spinoffs: ConnectorSummary<SpinoffPreview>;
  readingPaths: ConnectorSummary<ReadingPathPreview>;
}

export interface EventCardDTO {
  id: string;
  storyId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  type: string;
  importance: number;
  color: string | null;
  isBranchPoint: boolean;
  connectors: EventConnectors;
}

export interface EventConnectorsResponse {
  items: EventCardDTO[];
  total: number;
}

export type ConnectorKey = keyof EventConnectors;

export interface BranchComparisonChapter {
  id: string;
  title: string;
  orderIndex: number;
}

export interface BranchComparisonTrack {
  id: string;
  kind: 'main' | 'branch';
  title: string;
  previewChapters: BranchComparisonChapter[];
  totalChapters: number;
  stats: {
    readCount: number | null;
    averageRating: number | null;
  };
}

export interface BranchComparisonDTO {
  eventId: string;
  main: BranchComparisonTrack;
  branches: BranchComparisonTrack[];
}

export interface ForkPathResult {
  pathId: string;
  forkGroupId: string;
  addedNodes: number;
}
