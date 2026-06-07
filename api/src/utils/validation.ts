import { z } from 'zod';
import { SHARE_PLATFORMS } from './interaction';

export const registerSchema = z.object({
  email: z.string().email('无效的邮箱格式'),
  username: z.string().min(3, '用户名至少需要3个字符').max(20, '用户名不能超过20个字符'),
  password: z.string().min(6, '密码至少需要6个字符'),
  role: z.enum(['reader', 'author', 'admin']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('无效的邮箱格式'),
  password: z.string().min(1, '请输入密码'),
});

export const storySchema = z.object({
  title: z.string().min(1, '标题不能为空').max(100, '标题太长了'),
  description: z.string().max(1000, '描述太长了').optional(),
  coverImage: z.string().url('无效的封面图片链接').optional().or(z.literal('')),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['draft', 'published', 'finished']).optional(),
});

export const chapterSchema = z.object({
  storyId: z.string().uuid('无效的故事ID'),
  branchId: z.string().uuid('无效的分支ID').optional().nullable(),
  title: z.string().min(1, '章节标题不能为空').max(100),
  content: z.string().min(1, '章节内容不能为空'),
  orderIndex: z.number().int().min(0),
  isBranchPoint: z.boolean().optional(),
  characterData: z.any().optional(),
});

export const characterSchema = z.object({
  name: z.string().min(1, '角色名称不能为空').max(50),
  description: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  role: z.enum(['protagonist', 'antagonist', 'supporting', 'extra']).optional(),
  attributes: z.record(z.string(), z.any()).optional(),
});

export const branchSchema = z.object({
  parentStoryId: z.string().uuid('无效的父故事ID'),
  parentChapterId: z.string().uuid('无效的父章节ID'),
  title: z.string().min(1, '分支标题不能为空').max(100),
  description: z.string().min(1, '分支描述不能为空').max(500),
  branchType: z.enum(['parallel', 'alternative', 'if_timeline']).optional(),
  conditions: z.any().optional(),
  isOfficial: z.boolean().optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1, '评论内容不能为空').max(1000),
});

export const roleSchema = z.object({
  name: z.string().min(1, '角色名称不能为空').max(50),
  description: z.string().max(200).optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});

// Wrapped schemas for middleware
export const createStoryRequest = z.object({
  body: storySchema
});

export const updateStoryRequest = z.object({
  params: z.object({
    id: z.string().uuid('无效的故事ID')
  }),
  body: storySchema.partial()
});

export const createChapterRequest = z.object({
  body: chapterSchema
});

export const updateChapterRequest = z.object({
  params: z.object({
    id: z.string().uuid('无效的章节ID')
  }),
  body: chapterSchema.partial()
});

export const createBranchRequest = z.object({
  body: branchSchema
});

export const updateBranchRequest = z.object({
  params: z.object({
    id: z.string().uuid('无效的分支ID')
  }),
  body: branchSchema.partial()
});

export const createCharacterRequest = z.object({
  params: z.object({
    id: z.string().uuid('无效的故事ID')
  }),
  body: characterSchema
});

export const updateCharacterRequest = z.object({
  params: z.object({
    charId: z.string().uuid('无效的角色ID')
  }),
  body: characterSchema.partial()
});

export const createCommentRequest = z.object({
  body: commentSchema
});

export const createRoleRequest = z.object({
  body: roleSchema
});

export const updateRoleRequest = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: roleSchema.partial()
});

export const updateRolePermissionsRequest = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    permissionIds: z.array(z.string().uuid())
  })
});

export const bulkDeleteRolesRequest = z.object({
  body: z.object({
    ids: z.array(z.string().uuid())
  })
});

const interactionTargetParamsSchema = z.object({
  targetType: z.enum(['story', 'chapter', 'booklist', 'spinoff']),
  targetId: z.string().uuid('无效的目标ID'),
});

export const getInteractionStatsRequest = z.object({
  params: interactionTargetParamsSchema,
});

export const toggleLikeRequest = z.object({
  params: interactionTargetParamsSchema,
});

export const updateRatingRequest = z.object({
  params: interactionTargetParamsSchema,
  body: z.object({
    score: z.number().min(0.5).max(5),
    reasonTags: z.array(z.string()).optional(),
  }),
});

export const recordShareRequest = z.object({
  params: interactionTargetParamsSchema,
  body: z.object({
    platform: z.enum(SHARE_PLATFORMS).optional(),
  }),
});

export const listReviewCasesRequest = z.object({
  query: z.object({
    status: z.string().optional(),
    level: z.coerce.number().int().min(1).max(5).optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  }),
});

export const getReviewCaseRequest = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const addReviewCaseActionRequest = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    action: z.enum(['assign', 'annotate', 'comment', 'return', 'approve', 'reject', 'close']),
    payload: z.any().optional(),
  }),
});

export const listEditorialChangesRequest = z.object({
  query: z.object({
    status: z.string().optional(),
    targetType: z.string().optional(),
    targetId: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
    offset: z.coerce.number().int().min(0).optional(),
  }),
});

export const createEditorialChangeRequest = z.object({
  body: z.object({
    targetType: z.enum(['story', 'chapter', 'spinoff', 'booklist']),
    targetId: z.string().uuid(),
    field: z.enum(['title', 'description', 'content', 'coverImage', 'notes']),
    proposed: z.string().min(1),
    submit: z.boolean().optional(),
    sanitize: z.boolean().optional(),
    normalize: z.boolean().optional(),
  }),
});

export const getEditorialChangeRequest = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const applyEditorialChangeRequest = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const updateBooklistItemNotesRequest = z.object({
  params: z.object({
    id: z.string().uuid(),
    itemId: z.string().uuid(),
  }),
  body: z.object({
    notes: z.string().max(2000).optional().nullable(),
  }),
});

export const updateCommentRequest = z.object({
  params: z.object({
    commentId: z.string().uuid(),
  }),
  body: z.object({
    content: z.string().min(1).max(1000),
  }),
});

const characterAppearanceSchema = z.object({
  characterId: z.string().uuid('无效的角色ID'),
  targetType: z.enum(['chapter', 'branch', 'spinoff']),
  targetId: z.string().uuid('无效的目标ID'),
  appearanceType: z.enum(['appears', 'main_focus', 'mention', 'cameo']),
});

export const batchCharacterAppearancesRequest = z.object({
  params: z.object({
    id: z.string().uuid('无效的故事ID'),
  }),
  body: z.object({
    appearances: z.array(characterAppearanceSchema),
  }),
});

// ── Booklist Relations ────────────────────────────────

export const booklistRelationType = z.enum([
  'SAME_CHARACTER',
  'ALTERNATE_INTERPRETATION',
  'SHARED_UNIVERSE',
  'TIMELINE_FORK',
  'PARALLEL_EVENT',
  'PRECEDING_EVENT',
  'CHARACTER_CAMEO',
  'BACKGROUND_REFERENCE',
]);

export const booklistRelationSchema = z.object({
  sourceItemId: z.string().uuid('无效的源条目ID'),
  targetItemId: z.string().uuid('无效的目标条目ID'),
  relationType: booklistRelationType,
  label: z.string().max(200).optional().nullable(),
});

export const createBooklistRelationRequest = z.object({
  params: z.object({ id: z.string().uuid('无效的书单ID') }),
  body: booklistRelationSchema,
});

export const deleteBooklistRelationRequest = z.object({
  params: z.object({
    id: z.string().uuid('无效的书单ID'),
    relationId: z.string().uuid('无效的关系ID'),
  }),
});

export const getBooklistGraphRequest = z.object({
  params: z.object({ id: z.string().uuid('无效的书单ID') }),
});

// ── Reading Path (Cross-Story) ────────────────────────

export const readingPathNodeSchema = z.object({
  sortOrder: z.number().int().min(0),
  nodeCategory: z.string().min(1),
  contentId: z.string().min(1),
  storyId: z.string().uuid().optional().nullable(),
  storyTitle: z.string().max(200).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export const createReadingPathSchema = z.object({
  storyId: z.string().uuid('无效的故事ID').optional().nullable(),
  booklistId: z.string().uuid('无效的书单ID').optional().nullable(),
  title: z.string().min(1, '标题不能为空').max(200),
  description: z.string().max(1000).optional().nullable(),
  origin: z.string().max(50).optional(),
  nodes: z.array(readingPathNodeSchema).min(1, '至少需要一个节点'),
});

export const createReadingPathRequest = z.object({
  body: createReadingPathSchema,
});

export const updateReadingPathRequest = z.object({
  params: z.object({ id: z.string().uuid('无效的阅读路径ID') }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional().nullable(),
    nodes: z.array(readingPathNodeSchema).optional(),
  }),
});

// ── Wiki ──────────────────────────────────────────────

export const wikiPageContentType = z.enum(['character', 'setting', 'event', 'concept', 'faction', 'item']);

export const wikiPageSchema = z.object({
  storyId: z.string().uuid('无效的故事ID').optional().nullable(),
  title: z.string().min(1, '标题不能为空').max(200),
  slug: z.string().min(1, '别名不能为空').max(200).regex(/^[a-z0-9_-]+$/, '别名只能包含小写字母、数字、下划线和连字符').optional(),
  contentType: wikiPageContentType,
  content: z.string().min(1, '内容不能为空'),
  summary: z.string().max(500).optional().nullable(),
  attributes: z.record(z.string(), z.any()).optional().nullable(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const createWikiPageRequest = z.object({
  body: wikiPageSchema,
});

export const updateWikiPageRequest = z.object({
  params: z.object({
    id: z.string().uuid('无效的百科页面ID'),
  }),
  body: wikiPageSchema.partial(),
});

export const getWikiPageRequest = z.object({
  params: z.object({
    id: z.string().uuid('无效的百科页面ID'),
  }),
});

export const listWikiPagesRequest = z.object({
  query: z.object({
    storyId: z.string().uuid().optional(),
    contentType: wikiPageContentType.optional(),
    search: z.string().max(100).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

// ── Wiki Alias ────────────────────────────────────────

export const wikiAliasSchema = z.object({
  alias: z.string().min(1, '别名不能为空').max(100),
  language: z.string().max(10).optional().nullable(),
});

export const createWikiAliasRequest = z.object({
  params: z.object({
    id: z.string().uuid('无效的百科页面ID'),
  }),
  body: wikiAliasSchema,
});

export const deleteWikiAliasRequest = z.object({
  params: z.object({
    id: z.string().uuid('无效的百科页面ID'),
    aliasId: z.string().uuid('无效的别名ID'),
  }),
});

// ── Wiki Link ─────────────────────────────────────────

export const wikiLinkType = z.enum(['reference', 'see_also', 'parent', 'child', 'related']);

export const wikiLinkSchema = z.object({
  targetPageId: z.string().uuid('无效的目标页面ID'),
  linkType: wikiLinkType,
});

export const createWikiLinkRequest = z.object({
  params: z.object({
    id: z.string().uuid('无效的百科页面ID'),
  }),
  body: wikiLinkSchema,
});

export const deleteWikiLinkRequest = z.object({
  params: z.object({
    id: z.string().uuid('无效的百科页面ID'),
    linkId: z.string().uuid('无效的链接ID'),
  }),
});
