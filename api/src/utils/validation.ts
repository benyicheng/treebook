import { z } from 'zod';

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
  attributes: z.record(z.any()).optional(),
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
