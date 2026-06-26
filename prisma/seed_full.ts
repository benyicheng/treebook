/**
 * Comprehensive seed — covers ALL 49 Prisma models with realistic Chinese test data.
 *
 * Models covered:
 *   User, Role, Permission, UserRole, RolePermission, RefreshToken,
 *   Story, Tag, Chapter, Branch, Spinoff, Collaboration, MergeRequest,
 *   Character, CharacterAppearance, WikiPage, WikiAlias, WikiLink,
 *   Booklist, BooklistItem, BooklistItemRelation, BooklistStoryLink, BooklistProgress,
 *   ReadingPath, ReadingPathNode, ReadingTrail, ReadingProgress,
 *   ReadingSavepoint, ReadingHistory,
 *   Comment, Like, Rating, Follow, Activity, Notification,
 *   Wallet, Transaction,
 *   MediaAsset, MediaRiskLog,
 *   InteractionStat, InteractionEvent,
 *   ModerationJob, ModerationDecision, ModerationAuditLog,
 *   ModerationCase, ModerationCaseAction,
 *   EditorialChange, EditorialChangeAction,
 *   SiteConfig
 *
 * Run: npx tsx prisma/seed_full.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function futureDate(days = 30): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function pastDate(daysAgo = 1): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('=== seed_full: clearing all data ===');

  // 1. Delete in reverse-dependency order
  await prisma.moderationCaseAction.deleteMany();
  await prisma.moderationCase.deleteMany();
  await prisma.moderationAuditLog.deleteMany();
  await prisma.moderationDecision.deleteMany();
  await prisma.moderationJob.deleteMany();
  await prisma.editorialChangeAction.deleteMany();
  await prisma.editorialChange.deleteMany();
  await prisma.mediaRiskLog.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.siteConfig.deleteMany();
  await prisma.interactionStat.deleteMany();
  await prisma.interactionEvent.deleteMany();
  await prisma.like.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.wikiLink.deleteMany();
  await prisma.wikiAlias.deleteMany();
  await prisma.wikiPage.deleteMany();
  await prisma.readingPathNode.deleteMany();
  await prisma.readingPath.deleteMany();
  await prisma.readingTrail.deleteMany();
  await prisma.readingProgress.deleteMany();
  await prisma.readingSavepoint.deleteMany();
  await prisma.readingHistory.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.booklistItemRelation.deleteMany();
  await prisma.booklistItem.deleteMany();
  await prisma.booklistStoryLink.deleteMany();
  await prisma.booklistProgress.deleteMany();
  await prisma.booklist.deleteMany();
  await prisma.mergeRequest.deleteMany();
  await prisma.collaboration.deleteMany();
  await prisma.characterAppearance.deleteMany();
  await prisma.character.deleteMany();
  await prisma.spinoff.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.story.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  console.log('All data cleared.');

  // -----------------------------------------------------------------------
  // 2. Tags (standalone)
  // -----------------------------------------------------------------------
  const tagNames = ['科幻', '修仙', '玄幻', '神话', '冒险', '言情', '悬疑', '赛博朋克', '时空旅行', '末日'];
  const tags: Record<string, { id: string }> = {};
  for (const name of tagNames) {
    tags[name] = await prisma.tag.create({ data: { name } });
  }
  console.log(`Tags: ${tagNames.length}`);

  // -----------------------------------------------------------------------
  // 3. Users
  // -----------------------------------------------------------------------
  const pw = await bcrypt.hash('password123', 10);
  const adminPw = await bcrypt.hash('Admin123!', 10);

  const author = await prisma.user.create({
    data: {
      email: 'author@example.com',
      username: '艾萨克',
      passwordHash: pw,
      role: 'author',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=isaac',
      profile: JSON.stringify({ bio: '科幻作家，宇宙迷', website: 'https://isaac.example.com' }),
      followerCount: 5,
      followingCount: 3,
    },
  });

  const reader = await prisma.user.create({
    data: {
      email: 'reader@example.com',
      username: '星空游民',
      passwordHash: pw,
      role: 'reader',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=stargazer',
      profile: JSON.stringify({ bio: '阅读量破万卷', favoriteGenre: '科幻/修仙' }),
      followerCount: 2,
      followingCount: 4,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      username: '管理员',
      passwordHash: adminPw,
      role: 'admin',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      profile: JSON.stringify({ role: 'platform_admin' }),
      followerCount: 10,
    },
  });

  const secondAuthor = await prisma.user.create({
    data: {
      email: 'liuyun@example.com',
      username: '流云',
      passwordHash: pw,
      role: 'author',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liuyun',
      profile: JSON.stringify({ bio: '修仙小说作家，擅长世界观构建' }),
      followerCount: 3,
    },
  });

  const editorUser = await prisma.user.create({
    data: {
      email: 'editor@example.com',
      username: '清风编辑',
      passwordHash: pw,
      role: 'editor',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=editor',
    },
  });

  const users = { author, reader, admin, secondAuthor, editorUser };
  console.log(`Users: ${Object.keys(users).length}`);

  // -----------------------------------------------------------------------
  // 4. RBAC — Roles & Permissions
  // -----------------------------------------------------------------------
  const permData = [
    { code: 'user:create', description: 'Create users' },
    { code: 'user:read', description: 'View users' },
    { code: 'user:update', description: 'Update users' },
    { code: 'user:delete', description: 'Delete users' },
    { code: 'user:role:assign', description: 'Assign roles to users' },
    { code: 'role:create', description: 'Create roles' },
    { code: 'role:read', description: 'View roles' },
    { code: 'role:update', description: 'Update roles' },
    { code: 'role:delete', description: 'Delete roles' },
    { code: 'role:permission:assign', description: 'Assign permissions to roles' },
    { code: 'story:create', description: 'Create stories' },
    { code: 'story:read', description: 'View stories' },
    { code: 'story:update', description: 'Update stories' },
    { code: 'story:delete', description: 'Delete stories' },
    { code: 'story:audit', description: 'Audit stories' },
    { code: 'cms:manage', description: 'Manage site CMS configuration' },
    { code: 'moderation:view', description: 'View moderation dashboard' },
    { code: 'moderation:manage', description: 'Manage moderation decisions' },
    { code: 'moderation:review', description: 'Review moderation cases' },
    { code: 'system:settings', description: 'Manage system settings' },
    { code: 'system:logs', description: 'View system logs' },
  ];

  const permissions: Record<string, { id: string }> = {};
  for (const p of permData) {
    permissions[p.code] = await prisma.permission.create({ data: p });
  }

  const roleAdmin = await prisma.role.create({ data: { name: 'admin', description: 'Administrator' } });
  const roleEditor = await prisma.role.create({ data: { name: 'editor', description: 'Editor' } });
  const roleAuthor = await prisma.role.create({ data: { name: 'author', description: 'Author' } });
  const roleReader = await prisma.role.create({ data: { name: 'reader', description: 'Reader' } });

  // Admin gets all permissions
  for (const perm of Object.values(permissions)) {
    await prisma.rolePermission.create({ data: { roleId: roleAdmin.id, permissionId: perm.id } });
  }

  // Editor permissions
  const editorPermCodes = ['story:create', 'story:read', 'story:update', 'user:read', 'moderation:view'];
  for (const code of editorPermCodes) {
    await prisma.rolePermission.create({ data: { roleId: roleEditor.id, permissionId: permissions[code].id } });
  }

  // Author permissions
  const authorPermCodes = ['story:create', 'story:read', 'story:update', 'story:delete'];
  for (const code of authorPermCodes) {
    await prisma.rolePermission.create({ data: { roleId: roleAuthor.id, permissionId: permissions[code].id } });
  }

  // Reader permissions
  await prisma.rolePermission.create({ data: { roleId: roleReader.id, permissionId: permissions['story:read'].id } });

  // Assign roles to users
  await prisma.userRole.create({ data: { userId: admin.id, roleId: roleAdmin.id } });
  await prisma.userRole.create({ data: { userId: editorUser.id, roleId: roleEditor.id } });
  await prisma.userRole.create({ data: { userId: author.id, roleId: roleAuthor.id } });
  await prisma.userRole.create({ data: { userId: secondAuthor.id, roleId: roleAuthor.id } });
  await prisma.userRole.create({ data: { userId: reader.id, roleId: roleReader.id } });

  console.log('RBAC seeded.');

  // -----------------------------------------------------------------------
  // 5. RefreshTokens (for author)
  // -----------------------------------------------------------------------
  const rt = hashToken('test-refresh-token-' + author.id);
  await prisma.refreshToken.create({
    data: { tokenHash: rt, userId: author.id, expiresAt: futureDate(30) },
  });
  console.log('RefreshToken seeded.');

  // -----------------------------------------------------------------------
  // 6. Wallets
  // -----------------------------------------------------------------------
  const walletAuthor = await prisma.wallet.create({ data: { userId: author.id, balance: 250.0, currency: 'UNIV' } });
  const walletReader = await prisma.wallet.create({ data: { userId: reader.id, balance: 100.0, currency: 'UNIV' } });
  const walletSecond = await prisma.wallet.create({ data: { userId: secondAuthor.id, balance: 50.0, currency: 'UNIV' } });
  console.log('Wallets seeded.');

  // -----------------------------------------------------------------------
  // 7. Stories
  // -----------------------------------------------------------------------
  const story1 = await prisma.story.create({
    data: {
      title: '星际余晖',
      description: '在银河系边缘的废弃空间站，人类最后的幸存者发现了一个改变命运的秘密。',
      coverImage: 'https://picsum.photos/seed/scifi/800/600',
      authorId: author.id,
      status: 'ongoing',
      viewCount: 1520,
      branchCount: 2,
      tags: { connect: [{ name: '科幻' }, { name: '冒险' }, { name: '赛博朋克' }] },
    },
  });

  const story2 = await prisma.story.create({
    data: {
      title: '西游记',
      description: '师徒四人西天取经的故事',
      authorId: reader.id,
      status: 'ongoing',
      viewCount: 3200,
      tags: { connect: [{ name: '神话' }, { name: '冒险' }] },
    },
  });

  const story3 = await prisma.story.create({
    data: {
      title: '凡人修仙传',
      description: '一个普通山村小子，偶然之下跨入修仙行列。以平庸资质，如何在门派中立足？',
      coverImage: 'https://picsum.photos/seed/xianxia/800/600',
      authorId: author.id,
      status: 'ongoing',
      viewCount: 890,
      metadata: JSON.stringify({ worldName: '天元大陆', cultivationLevels: ['练气', '筑基', '金丹', '元婴'] }),
      tags: { connect: [{ name: '修仙' }, { name: '玄幻' }] },
    },
  });

  const stories = { story1, story2, story3 };
  console.log('Stories seeded.');

  // -----------------------------------------------------------------------
  // 8. Chapters
  // -----------------------------------------------------------------------
  const ch11 = await prisma.chapter.create({
    data: { storyId: story1.id, title: '第一章：遗忘的哨所', content: '<p>空间站的走廊里弥漫着陈旧的臭氧味...</p>', orderIndex: 1, isBranchPoint: true },
  });
  const ch12 = await prisma.chapter.create({
    data: { storyId: story1.id, title: '第二章：古老的信号', content: '<p>终端机屏幕上跳动着不属于人类文明的字符...</p>', orderIndex: 2 },
  });
  const ch13 = await prisma.chapter.create({
    data: { storyId: story1.id, title: '第三章：深渊的回声', content: '<p>信号源来自未知星域，卡特决定深入调查...</p>', orderIndex: 3, isBranchPoint: true },
  });

  const ch21 = await prisma.chapter.create({
    data: { storyId: story2.id, title: '第一回：灵根育孕源流出 心性修持大道生', content: '<p>东胜神洲傲来国海中有花果山...</p>', orderIndex: 1, isBranchPoint: true },
  });
  const ch22 = await prisma.chapter.create({
    data: { storyId: story2.id, title: '第二回：悟彻菩提真妙理 断魔归本合元神', content: '<p>美猴王在灵台方寸山学艺...</p>', orderIndex: 2 },
  });

  const ch31 = await prisma.chapter.create({
    data: { storyId: story3.id, title: '第一章：山边小村', content: '<p>二愣子睁大着双眼，直直望着茅草和烂泥糊成的黑屋顶...</p>', orderIndex: 1, isBranchPoint: true },
  });
  const ch32 = await prisma.chapter.create({
    data: { storyId: story3.id, title: '第二章：七玄门', content: '<p>韩立踏入了七玄门的山门，从此踏上修仙之路...</p>', orderIndex: 2 },
  });
  const ch33 = await prisma.chapter.create({
    data: { storyId: story3.id, title: '第三章：掌天瓶', content: '<p> mysterious 小瓶竟有催熟灵药的神效...</p>', orderIndex: 3 },
  });

  // -----------------------------------------------------------------------
  // 9. Branches
  // -----------------------------------------------------------------------
  const branch1 = await prisma.branch.create({
    data: {
      parentStoryId: story1.id, parentChapterId: ch11.id, authorId: reader.id,
      title: '暗影协议', description: '假如主角没有选择开启秘密，而是选择了逃离...',
      branchType: 'alternate', isOfficial: false, viewCount: 340,
    },
  });
  const branchCh1 = await prisma.chapter.create({
    data: { storyId: story1.id, branchId: branch1.id, title: '分支：紧急撤离', content: '<p>警报声响起，主角冲向了逃生舱...</p>', orderIndex: 1 },
  });

  const branch2 = await prisma.branch.create({
    data: {
      parentStoryId: story1.id, parentChapterId: ch13.id, authorId: secondAuthor.id,
      title: '星辰之泪', description: '卡特在深渊中发现了一个古老的文明遗迹...',
      branchType: 'parallel', isOfficial: true, isCertified: true, certifiedAt: pastDate(30),
      contributionScore: 85, status: 'ongoing', viewCount: 180,
    },
  });
  const branch2Ch1 = await prisma.chapter.create({
    data: { storyId: story1.id, branchId: branch2.id, title: '星辰之泪·其一', content: '<p>深空之中，巨大的环形结构静静漂浮...</p>', orderIndex: 1 },
  });

  console.log('Chapters & Branches seeded.');

  // -----------------------------------------------------------------------
  // 10. Spinoffs
  // -----------------------------------------------------------------------
  const spinoff1 = await prisma.spinoff.create({
    data: {
      authorId: secondAuthor.id, originalStoryId: story1.id, originalBranchId: branch2.id,
      title: 'NEXUS前传：AI的觉醒', summary: '空间站AI在接触未知文明信号前的自我意识萌芽',
      content: '<p>在卡特抵达空间站的十年前，NEXUS-9开始做梦...</p>',
      type: 'biography', status: 'completed', isOfficial: false, viewCount: 95,
    },
  });

  const spinoff2 = await prisma.spinoff.create({
    data: {
      authorId: reader.id, originalStoryId: story3.id,
      title: '凡人修仙传·墨彩环外传', summary: '墨府小姐视角的平行故事',
      content: '<p>彩环站在阁楼上，看着那个少年背着药篓远去...</p>',
      type: 'if_timeline', status: 'ongoing', viewCount: 210,
    },
  });

  console.log('Spinoffs seeded.');

  // -----------------------------------------------------------------------
  // 11. Characters
  // -----------------------------------------------------------------------
  const charCaptain = await prisma.character.create({
    data: { storyId: story1.id, name: '艾伦·卡特', description: '银河联盟第7探索舰前舰长，冷静果断', role: 'protagonist' },
  });
  const charAI = await prisma.character.create({
    data: { storyId: story1.id, name: 'NEXUS-9', description: '空间站中枢人工智能，其真实意图无人知晓', role: 'antagonist' },
  });
  const charCommander = await prisma.character.create({
    data: { storyId: story1.id, name: '李薇', description: '空间站驻留指挥官，技术专家', role: 'supporting' },
  });
  const charNavigator = await prisma.character.create({
    data: { storyId: story1.id, name: '杰克·陈', description: '导航员，对未知星域充满好奇', role: 'supporting' },
  });
  const charSunWuKong = await prisma.character.create({
    data: { storyId: story2.id, name: '孙悟空', description: '齐天大圣，天产石猴', role: 'protagonist' },
  });
  const charHanLi = await prisma.character.create({
    data: { storyId: story3.id, name: '韩立', description: '山村少年，心智坚韧，资质平庸', role: 'protagonist' },
  });
  const charNangongWan = await prisma.character.create({
    data: { storyId: story3.id, name: '南宫婉', description: '掩月宗女修，韩立的道侣', role: 'supporting' },
  });
  const charMoJiao = await prisma.character.create({
    data: { storyId: story3.id, name: '墨彩环', description: '墨府小姐，心高气傲', role: 'supporting' },
  });

  console.log('Characters seeded.');

  // -----------------------------------------------------------------------
  // 12. CharacterAppearances
  // -----------------------------------------------------------------------
  await prisma.characterAppearance.create({ data: { characterId: charCaptain.id, targetType: 'chapter', targetId: ch11.id, appearanceType: 'main_focus' } });
  await prisma.characterAppearance.create({ data: { characterId: charCaptain.id, targetType: 'chapter', targetId: ch12.id, appearanceType: 'main_focus' } });
  await prisma.characterAppearance.create({ data: { characterId: charAI.id, targetType: 'chapter', targetId: ch11.id, appearanceType: 'mention' } });
  await prisma.characterAppearance.create({ data: { characterId: charAI.id, targetType: 'chapter', targetId: ch12.id, appearanceType: 'appears' } });
  await prisma.characterAppearance.create({ data: { characterId: charCommander.id, targetType: 'chapter', targetId: ch11.id, appearanceType: 'appears' } });
  await prisma.characterAppearance.create({ data: { characterId: charNavigator.id, targetType: 'branch', targetId: branch2.id, appearanceType: 'appears' } });
  await prisma.characterAppearance.create({ data: { characterId: charCaptain.id, targetType: 'spinoff', targetId: spinoff1.id, appearanceType: 'cameo' } });
  await prisma.characterAppearance.create({ data: { characterId: charHanLi.id, targetType: 'chapter', targetId: ch31.id, appearanceType: 'main_focus' } });
  await prisma.characterAppearance.create({ data: { characterId: charHanLi.id, targetType: 'chapter', targetId: ch32.id, appearanceType: 'main_focus' } });
  await prisma.characterAppearance.create({ data: { characterId: charNangongWan.id, targetType: 'chapter', targetId: ch32.id, appearanceType: 'mention' } });
  await prisma.characterAppearance.create({ data: { characterId: charMoJiao.id, targetType: 'chapter', targetId: ch31.id, appearanceType: 'cameo' } });
  await prisma.characterAppearance.create({ data: { characterId: charMoJiao.id, targetType: 'spinoff', targetId: spinoff2.id, appearanceType: 'main_focus' } });
  console.log('CharacterAppearances seeded.');

  // -----------------------------------------------------------------------
  // 13. WikiPages
  // -----------------------------------------------------------------------
  const wikiChar = await prisma.wikiPage.create({
    data: {
      storyId: story1.id, title: '艾伦·卡特', slug: 'alan-carter',
      contentType: 'character', content: '## 艾伦·卡特\n\n银河联盟第7探索舰前舰长...',
      summary: '故事主角，银河联盟精英', createdBy: author.id,
    },
  });
  const wikiNexus = await prisma.wikiPage.create({
    data: {
      storyId: story1.id, title: 'NEXUS-9', slug: 'nexus-9',
      contentType: 'character', content: '## NEXUS-9\n\n空间站中枢AI，拥有超越图灵测试的智慧...',
      summary: '神秘的人工智能', createdBy: author.id,
    },
  });
  const wikiStation = await prisma.wikiPage.create({
    data: {
      storyId: story1.id, title: '深空七号空间站', slug: 'deep-space-7',
      contentType: 'setting', content: '## 深空七号\n\n位于银河系旋臂边缘的废弃科研空间站...',
      summary: '故事的主要场景', createdBy: author.id,
    },
  });
  const wikiCultivation = await prisma.wikiPage.create({
    data: {
      storyId: story3.id, title: '修仙境界', slug: 'cultivation-realms',
      contentType: 'concept', content: '## 修仙境界\n\n练气→筑基→金丹→元婴→化神...',
      summary: '修仙等级体系', createdBy: author.id,
    },
  });
  console.log('WikiPages seeded.');

  // -----------------------------------------------------------------------
  // 14. WikiAliases
  // -----------------------------------------------------------------------
  await prisma.wikiAlias.create({ data: { wikiPageId: wikiNexus.id, alias: 'NEXUS', language: 'en' } });
  await prisma.wikiAlias.create({ data: { wikiPageId: wikiNexus.id, alias: '中枢AI', language: 'zh' } });
  await prisma.wikiAlias.create({ data: { wikiPageId: wikiStation.id, alias: 'DS-7', language: 'en' } });
  console.log('WikiAliases seeded.');

  // -----------------------------------------------------------------------
  // 15. WikiLinks
  // -----------------------------------------------------------------------
  await prisma.wikiLink.create({ data: { sourcePageId: wikiChar.id, targetPageId: wikiNexus.id, linkType: 'related' } });
  await prisma.wikiLink.create({ data: { sourcePageId: wikiChar.id, targetPageId: wikiStation.id, linkType: 'reference' } });
  await prisma.wikiLink.create({ data: { sourcePageId: wikiStation.id, targetPageId: wikiNexus.id, linkType: 'see_also' } });
  console.log('WikiLinks seeded.');

  // -----------------------------------------------------------------------
  // 16. Booklists
  // -----------------------------------------------------------------------
  const booklist1 = await prisma.booklist.create({
    data: {
      creatorId: author.id, title: '硬核科幻必读路线',
      description: '从遗忘哨所到最终真相的深度探索。',
      type: 'COLLECTION', isPublic: true, viewCount: 520, likesCount: 28,
    },
  });
  const booklist2 = await prisma.booklist.create({
    data: {
      creatorId: reader.id, title: '修仙入门指南',
      description: '从凡人到元婴的完整阅读路径',
      type: 'TIMELINE', isPublic: true, viewCount: 180, likesCount: 12,
    },
  });
  const booklist3 = await prisma.booklist.create({
    data: {
      creatorId: editorUser.id, title: '平台精选·六月推荐',
      description: '本月必读的优质故事',
      type: 'COLLECTION', isPublic: true, viewCount: 1100, likesCount: 45,
    },
  });

  // BooklistItems
  const bli1 = await prisma.booklistItem.create({ data: { booklistId: booklist1.id, chapterId: ch11.id, targetType: 'chapter', targetId: ch11.id, orderIndex: 1, notes: '开篇必读', section: 'mainline' } });
  const bli2 = await prisma.booklistItem.create({ data: { booklistId: booklist1.id, chapterId: ch12.id, targetType: 'chapter', targetId: ch12.id, orderIndex: 2, notes: '核心悬念', section: 'mainline' } });
  const bli3 = await prisma.booklistItem.create({ data: { booklistId: booklist1.id, chapterId: ch13.id, targetType: 'chapter', targetId: ch13.id, orderIndex: 3, notes: '剧情高潮', section: 'mainline' } });

  await prisma.booklistItem.create({ data: { booklistId: booklist2.id, chapterId: ch31.id, targetType: 'chapter', targetId: ch31.id, orderIndex: 1, notes: '凡人起点', section: 'mainline' } });
  await prisma.booklistItem.create({ data: { booklistId: booklist2.id, chapterId: ch32.id, targetType: 'chapter', targetId: ch32.id, orderIndex: 2, notes: '入门七玄门', section: 'mainline' } });

  await prisma.booklistItem.create({ data: { booklistId: booklist3.id, chapterId: ch11.id, targetType: 'chapter', targetId: ch11.id, orderIndex: 1, section: 'mainline' } });
  await prisma.booklistItem.create({ data: { booklistId: booklist3.id, chapterId: ch21.id, targetType: 'chapter', targetId: ch21.id, orderIndex: 2, section: 'mainline' } });
  await prisma.booklistItem.create({ data: { booklistId: booklist3.id, chapterId: ch31.id, targetType: 'chapter', targetId: ch31.id, orderIndex: 3, section: 'mainline' } });

  // BooklistItemRelations (graph edges)
  await prisma.booklistItemRelation.create({ data: { sourceItemId: bli1.id, targetItemId: bli2.id, relationType: 'PRECEDING_EVENT', label: '剧情推进' } });
  await prisma.booklistItemRelation.create({ data: { sourceItemId: bli2.id, targetItemId: bli3.id, relationType: 'PRECEDING_EVENT', label: '悬念升级' } });

  // BooklistStoryLinks
  await prisma.booklistStoryLink.create({ data: { booklistId: booklist1.id, storyId: story1.id, relation: 'featured' } });
  await prisma.booklistStoryLink.create({ data: { booklistId: booklist2.id, storyId: story3.id, relation: 'featured' } });
  await prisma.booklistStoryLink.create({ data: { booklistId: booklist3.id, storyId: story1.id, relation: 'featured' } });
  await prisma.booklistStoryLink.create({ data: { booklistId: booklist3.id, storyId: story2.id, relation: 'referenced' } });

  // BooklistProgress
  await prisma.booklistProgress.create({ data: { userId: reader.id, booklistId: booklist1.id, currentItemIndex: 1, completedItemIds: JSON.stringify([bli1.id]) } });

  console.log('Booklists seeded.');

  // -----------------------------------------------------------------------
  // 17. Collaborations
  // -----------------------------------------------------------------------
  await prisma.collaboration.create({
    data: { storyId: story1.id, userId: secondAuthor.id, role: 'editor', permissions: JSON.stringify(['edit_chapters']), status: 'accepted' },
  });
  await prisma.collaboration.create({
    data: { storyId: story3.id, userId: reader.id, role: 'contributor', status: 'pending' },
  });
  console.log('Collaborations seeded.');

  // -----------------------------------------------------------------------
  // 18. MergeRequests
  // -----------------------------------------------------------------------
  await prisma.mergeRequest.create({
    data: { type: 'spinoff_official', spinoffId: spinoff1.id, storyId: story1.id, status: 'approved', message: '申请将NEXUS前传合并入主线', reviewComment: '内容质量优秀，批准合并' },
  });
  await prisma.mergeRequest.create({
    data: { type: 'branch_merge', branchId: branch1.id, storyId: story1.id, status: 'pending', message: '暗影协议分支请求合并入世界观补充' },
  });
  console.log('MergeRequests seeded.');

  // -----------------------------------------------------------------------
  // 19. ReadingPaths
  // -----------------------------------------------------------------------
  const rp1 = await prisma.readingPath.create({
    data: {
      storyId: story1.id, creatorId: author.id, title: '星际余晖·主线探索',
      description: '从发现信号到揭开真相的完整主线旅程', origin: 'author', viewCount: 320,
    },
  });
  await prisma.readingPathNode.create({ data: { pathId: rp1.id, sortOrder: 0, nodeCategory: 'chapter', contentId: ch11.id, contentTitle: '遗忘的哨所', note: '故事从这里开始' } });
  await prisma.readingPathNode.create({ data: { pathId: rp1.id, sortOrder: 1, nodeCategory: 'chapter', contentId: ch12.id, contentTitle: '古老的信号', note: '神秘信号之谜' } });
  await prisma.readingPathNode.create({ data: { pathId: rp1.id, sortOrder: 2, nodeCategory: 'chapter', contentId: ch13.id, contentTitle: '深渊的回声', note: '真相逐渐浮出水面' } });

  const rp2 = await prisma.readingPath.create({
    data: {
      storyId: story3.id, creatorId: secondAuthor.id, title: '韩立崛起之路',
      description: '从山村少年到纵横修仙界的完整路径', origin: 'community', viewCount: 150,
    },
  });
  await prisma.readingPathNode.create({ data: { pathId: rp2.id, sortOrder: 0, nodeCategory: 'chapter', contentId: ch31.id, contentTitle: '山边小村' } });
  await prisma.readingPathNode.create({ data: { pathId: rp2.id, sortOrder: 1, nodeCategory: 'chapter', contentId: ch32.id, contentTitle: '七玄门' } });
  await prisma.readingPathNode.create({ data: { pathId: rp2.id, sortOrder: 2, nodeCategory: 'chapter', contentId: ch33.id, contentTitle: '掌天瓶' } });

  const rp3 = await prisma.readingPath.create({
    data: {
      booklistId: booklist1.id, storyId: story1.id, creatorId: author.id,
      title: '书单：硬核科幻路线', description: '基于硬核科幻书单的阅读路径',
      origin: 'community', viewCount: 65,
    },
  });
  await prisma.readingPathNode.create({ data: { pathId: rp3.id, sortOrder: 0, nodeCategory: 'chapter', contentId: ch11.id } });
  await prisma.readingPathNode.create({ data: { pathId: rp3.id, sortOrder: 1, nodeCategory: 'chapter', contentId: ch12.id } });
  console.log('ReadingPaths seeded.');

  // -----------------------------------------------------------------------
  // 20. Comments
  // -----------------------------------------------------------------------
  const comment1 = await prisma.comment.create({ data: { content: '开篇氛围营造得非常好，期待后续发展！', authorId: reader.id, chapterId: ch11.id, createdAt: pastDate(5) } });
  const comment2 = await prisma.comment.create({ data: { content: '这个伏笔埋得太深了，二刷才发现很多细节', authorId: secondAuthor.id, chapterId: ch11.id, createdAt: pastDate(3) } });
  const comment3 = await prisma.comment.create({ data: { content: 'NEXUS-9的空间站描述让我想起了《2001太空漫游》', authorId: author.id, chapterId: ch12.id, createdAt: pastDate(1) } });
  const comment4 = await prisma.comment.create({ data: { content: '韩立这个人物刻画得很真实，资质平庸但心智坚韧', authorId: reader.id, chapterId: ch31.id } });
  const comment5 = await prisma.comment.create({ data: { content: '墨彩环外传写得真好，补充了原作中缺失的女性视角', authorId: author.id, chapterId: ch31.id } });
  console.log('Comments seeded.');

  // -----------------------------------------------------------------------
  // 21. Likes
  // -----------------------------------------------------------------------
  await prisma.like.create({ data: { userId: reader.id, targetType: 'story', targetId: story1.id } });
  await prisma.like.create({ data: { userId: secondAuthor.id, targetType: 'story', targetId: story1.id } });
  await prisma.like.create({ data: { userId: reader.id, targetType: 'chapter', targetId: ch11.id } });
  await prisma.like.create({ data: { userId: author.id, targetType: 'comment', targetId: comment1.id } });
  await prisma.like.create({ data: { userId: secondAuthor.id, targetType: 'comment', targetId: comment1.id } });
  await prisma.like.create({ data: { userId: reader.id, targetType: 'comment', targetId: comment3.id } });
  await prisma.like.create({ data: { userId: reader.id, targetType: 'branch', targetId: branch2.id } });
  await prisma.like.create({ data: { userId: author.id, targetType: 'spinoff', targetId: spinoff2.id } });
  console.log('Likes seeded.');

  // -----------------------------------------------------------------------
  // 22. Ratings
  // -----------------------------------------------------------------------
  await prisma.rating.create({ data: { userId: reader.id, targetType: 'story', targetId: story1.id, valueInt: 5, reasonTags: '人物塑造,世界观' } });
  await prisma.rating.create({ data: { userId: secondAuthor.id, targetType: 'story', targetId: story1.id, valueInt: 4, reasonTags: '剧情' } });
  await prisma.rating.create({ data: { userId: author.id, targetType: 'story', targetId: story2.id, valueInt: 5, reasonTags: '经典,文学' } });
  await prisma.rating.create({ data: { userId: reader.id, targetType: 'branch', targetId: branch2.id, valueInt: 4 } });
  await prisma.rating.create({ data: { userId: author.id, targetType: 'spinoff', targetId: spinoff1.id, valueInt: 5 } });
  console.log('Ratings seeded.');

  // -----------------------------------------------------------------------
  // 23. Follows
  // -----------------------------------------------------------------------
  await prisma.follow.create({ data: { followerId: reader.id, followingId: author.id } });
  await prisma.follow.create({ data: { followerId: reader.id, followingId: secondAuthor.id } });
  await prisma.follow.create({ data: { followerId: secondAuthor.id, followingId: author.id } });
  await prisma.follow.create({ data: { followerId: author.id, followingId: reader.id } });
  await prisma.follow.create({ data: { followerId: editorUser.id, followingId: author.id } });
  console.log('Follows seeded.');

  // -----------------------------------------------------------------------
  // 24. ReadingSavepoints
  // -----------------------------------------------------------------------
  await prisma.readingSavepoint.create({ data: { userId: reader.id, storyId: story1.id, chapterId: ch12.id, name: '二刷进度' } });
  await prisma.readingSavepoint.create({ data: { userId: reader.id, storyId: story3.id, chapterId: ch32.id, name: '看到七玄门' } });
  await prisma.readingSavepoint.create({ data: { userId: secondAuthor.id, storyId: story1.id, branchId: branch2.id, chapterId: branch2Ch1.id, name: '分支创作中' } });
  console.log('ReadingSavepoints seeded.');

  // -----------------------------------------------------------------------
  // 25. ReadingHistory
  // -----------------------------------------------------------------------
  await prisma.readingHistory.create({ data: { userId: reader.id, chapterId: ch11.id, progress: 100, readAt: pastDate(2) } });
  await prisma.readingHistory.create({ data: { userId: reader.id, chapterId: ch12.id, progress: 65, readAt: pastDate(1) } });
  await prisma.readingHistory.create({ data: { userId: reader.id, chapterId: ch31.id, progress: 100, referralBooklistId: booklist2.id, readAt: pastDate(3) } });
  await prisma.readingHistory.create({ data: { userId: secondAuthor.id, chapterId: ch11.id, progress: 100, readAt: pastDate(5) } });
  await prisma.readingHistory.create({ data: { userId: author.id, chapterId: ch31.id, progress: 80, readAt: pastDate(1) } });
  console.log('ReadingHistory seeded.');

  // -----------------------------------------------------------------------
  // 26. ReadingTrails
  // -----------------------------------------------------------------------
  await prisma.readingTrail.create({
    data: {
      userId: reader.id, pathId: rp1.id, storyId: story1.id,
      currentNodeIndex: 1, trailNodes: JSON.stringify([ch11.id, ch12.id]),
      startedAt: pastDate(7),
    },
  });
  await prisma.readingTrail.create({
    data: {
      userId: reader.id, storyId: story3.id,
      currentNodeIndex: 0, trailNodes: JSON.stringify([ch31.id]),
      startedAt: pastDate(3),
    },
  });
  console.log('ReadingTrails seeded.');

  // -----------------------------------------------------------------------
  // 27. ReadingProgress
  // -----------------------------------------------------------------------
  await prisma.readingProgress.create({ data: { userId: reader.id, chapterId: ch11.id, source: 'booklist', sourceId: booklist1.id, status: 'completed', progress: 100 } });
  await prisma.readingProgress.create({ data: { userId: reader.id, chapterId: ch12.id, source: 'readingpath', sourceId: rp1.id, status: 'reading', progress: 65 } });
  await prisma.readingProgress.create({ data: { userId: reader.id, chapterId: ch31.id, source: 'booklist', sourceId: booklist2.id, status: 'completed', progress: 100 } });
  console.log('ReadingProgress seeded.');

  // -----------------------------------------------------------------------
  // 28. Transactions
  // -----------------------------------------------------------------------
  await prisma.transaction.create({ data: { userId: author.id, amount: 50.0, type: 'REVENUE_SHARE', targetType: 'STORY', targetId: story1.id, description: '星际余晖收益分成' } });
  await prisma.transaction.create({ data: { userId: secondAuthor.id, amount: 10.0, type: 'REVENUE_SHARE', targetType: 'BRANCH', targetId: branch2.id, description: '星辰之泪分支收益' } });
  await prisma.transaction.create({ data: { userId: reader.id, amount: -20.0, type: 'RECHARGE', description: '购买UNIV币' } });
  console.log('Transactions seeded.');

  // -----------------------------------------------------------------------
  // 29. Activities
  // -----------------------------------------------------------------------
  await prisma.activity.create({ data: { actorId: author.id, type: 'story_publish', targetType: 'story', targetId: story1.id, metadata: JSON.stringify({ title: '星际余晖' }) } });
  await prisma.activity.create({ data: { actorId: reader.id, type: 'branch_create', targetType: 'branch', targetId: branch1.id, metadata: JSON.stringify({ title: '暗影协议', storyTitle: '星际余晖' }) } });
  await prisma.activity.create({ data: { actorId: secondAuthor.id, type: 'spinoff_publish', targetType: 'spinoff', targetId: spinoff1.id, metadata: JSON.stringify({ title: 'NEXUS前传' }) } });
  await prisma.activity.create({ data: { actorId: author.id, type: 'chapter_update', targetType: 'chapter', targetId: ch13.id, metadata: JSON.stringify({ title: '深渊的回声', storyTitle: '星际余晖' }) } });
  await prisma.activity.create({ data: { actorId: reader.id, type: 'merge_request', targetType: 'branch', targetId: branch1.id, metadata: JSON.stringify({ title: '暗影协议' }) } });
  console.log('Activities seeded.');

  // -----------------------------------------------------------------------
  // 30. Notifications
  // -----------------------------------------------------------------------
  await prisma.notification.create({ data: { userId: author.id, actorId: reader.id, type: 'comment_reply', targetType: 'comment', targetId: comment1.id, message: '星空游民评论了你的章节' } });
  await prisma.notification.create({ data: { userId: author.id, actorId: secondAuthor.id, type: 'merge_requested', targetType: 'merge_request', targetId: '', message: '流云提交了分支合并请求' } });
  await prisma.notification.create({ data: { userId: reader.id, actorId: author.id, type: 'merge_approved', targetType: 'merge_request', targetId: '', message: '你的合并请求已被批准' } });
  await prisma.notification.create({ data: { userId: reader.id, actorId: secondAuthor.id, type: 'branch_created', targetType: 'branch', targetId: branch2.id, message: '流云创建了星辰之泪分支' } });
  await prisma.notification.create({ data: { userId: reader.id, type: 'comment_reply', targetType: 'comment', targetId: comment4.id, message: '你的评论收到了回复' } });
  console.log('Notifications seeded.');

  // -----------------------------------------------------------------------
  // 31. InteractionStats (aggregated counters)
  // -----------------------------------------------------------------------
  await prisma.interactionStat.create({ data: { targetType: 'story', targetId: story1.id, likeCount: 2, ratingCount: 2, ratingSum: 9, shareCount: 5, viewCount: 1520 } });
  await prisma.interactionStat.create({ data: { targetType: 'story', targetId: story2.id, likeCount: 0, ratingCount: 1, ratingSum: 5, viewCount: 3200 } });
  await prisma.interactionStat.create({ data: { targetType: 'story', targetId: story3.id, likeCount: 0, ratingCount: 0, ratingSum: 0, viewCount: 890 } });
  await prisma.interactionStat.create({ data: { targetType: 'branch', targetId: branch2.id, likeCount: 1, ratingCount: 1, ratingSum: 4, viewCount: 180 } });
  await prisma.interactionStat.create({ data: { targetType: 'spinoff', targetId: spinoff1.id, shareCount: 2, viewCount: 95 } });
  console.log('InteractionStats seeded.');

  // -----------------------------------------------------------------------
  // 32. InteractionEvents (raw event log)
  // -----------------------------------------------------------------------
  await prisma.interactionEvent.create({ data: { type: 'view', targetType: 'story', targetId: story1.id, userId: reader.id, platform: 'web', createdAt: pastDate(1) } });
  await prisma.interactionEvent.create({ data: { type: 'like', targetType: 'story', targetId: story1.id, userId: reader.id, platform: 'web', createdAt: pastDate(2) } });
  await prisma.interactionEvent.create({ data: { type: 'share', targetType: 'story', targetId: story1.id, platform: 'mobile', createdAt: pastDate(3) } });
  await prisma.interactionEvent.create({ data: { type: 'rating', targetType: 'story', targetId: story1.id, userId: reader.id, score: 5, reasonTags: '人物塑造,世界观', createdAt: pastDate(2) } });
  await prisma.interactionEvent.create({ data: { type: 'view', targetType: 'chapter', targetId: ch11.id, userId: reader.id, platform: 'web', createdAt: pastDate(1) } });
  await prisma.interactionEvent.create({ data: { type: 'view', targetType: 'chapter', targetId: ch31.id, userId: author.id, platform: 'web', createdAt: pastDate(1) } });
  console.log('InteractionEvents seeded.');

  // -----------------------------------------------------------------------
  // 33. MediaAssets
  // -----------------------------------------------------------------------
  const asset1 = await prisma.mediaAsset.create({
    data: {
      ownerUserId: author.id, purpose: 'cover', originalName: '星际余晖封面.png',
      mimeType: 'image/png', sizeBytes: 245000, sha256: 'a'.repeat(64),
      storageProvider: 'local', storagePath: '/uploads/covers/scifi-cover.png', status: 'active',
      width: 800, height: 600,
    },
  });
  const asset2 = await prisma.mediaAsset.create({
    data: {
      ownerUserId: reader.id, purpose: 'avatar', originalName: 'avatar.jpg',
      mimeType: 'image/jpeg', sizeBytes: 32000, sha256: 'b'.repeat(64),
      storageProvider: 'local', storagePath: '/uploads/avatars/reader.jpg', status: 'active',
      width: 128, height: 128,
    },
  });
  // MediaRiskLog
  await prisma.mediaRiskLog.create({ data: { assetId: asset1.id, kind: 'size_check', severity: 'info', message: '封面图片尺寸合规' } });
  await prisma.mediaRiskLog.create({ data: { assetId: asset2.id, kind: 'type_check', severity: 'info', message: '头像图片格式合规' } });
  console.log('MediaAssets seeded.');

  // -----------------------------------------------------------------------
  // 34. Moderation
  // -----------------------------------------------------------------------
  const modJob = await prisma.moderationJob.create({
    data: { status: 'completed', request: JSON.stringify({ targetType: 'chapter', targetId: ch31.id, field: 'content' }), attempts: 1 },
  });
  await prisma.moderationDecision.create({
    data: {
      jobId: modJob.id, businessLine: 'content_safety', targetType: 'chapter', targetId: ch31.id,
      contentType: 'text', field: 'content', status: 'approved',
      labels: '[]', reasons: '内容安全，无违规', score: 0.98, provider: 'llm',
    },
  });
  await prisma.moderationAuditLog.create({
    data: { action: 'decision_made', targetType: 'chapter', targetId: ch31.id, decisionId: '', payload: JSON.stringify({ result: 'approved' }) },
  });

  // ModerationCase with case actions
  const modCase = await prisma.moderationCase.create({
    data: {
      businessLine: 'content_safety', targetType: 'comment', targetId: comment4.id,
      contentType: 'text', status: 'open', level: 2, snapshot: JSON.stringify({ content: comment4.content }),
    },
  });
  await prisma.moderationCaseAction.create({
    data: { caseId: modCase.id, action: 'opened', actorUserId: admin.id, payload: JSON.stringify({ reason: 'automated_flag' }) },
  });

  // EditorialChange with action
  const editChange = await prisma.editorialChange.create({
    data: {
      targetType: 'story', targetId: story1.id, field: 'description',
      status: 'pending', original: story1.description, proposed: '修改后的故事描述...',
      createdBy: editorUser.id,
    },
  });
  await prisma.editorialChangeAction.create({
    data: { changeId: editChange.id, action: 'proposed', actorUserId: editorUser.id, payload: JSON.stringify({ reason: '优化描述准确性' }) },
  });

  console.log('Moderation & Editorial seeded.');

  // -----------------------------------------------------------------------
  // 35. SiteConfig
  // -----------------------------------------------------------------------
  await prisma.siteConfig.create({ data: { key: 'siteName', value: JSON.stringify('平行宇宙写作平台') } });
  await prisma.siteConfig.create({ data: { key: 'siteDescription', value: JSON.stringify('一个创新型多人协作写作环境') } });
  await prisma.siteConfig.create({ data: { key: 'announcement', value: JSON.stringify('欢迎来到平行宇宙！新版阅读路径功能已上线。') } });
  await prisma.siteConfig.create({ data: { key: 'maintenanceMode', value: JSON.stringify(false) } });
  await prisma.siteConfig.create({ data: { key: 'maxUploadSizeMb', value: JSON.stringify(10) } });
  console.log('SiteConfig seeded.');

  // -----------------------------------------------------------------------
  // Done
  // -----------------------------------------------------------------------
  console.log('\n=== seed_full: ALL DATA SEEDED SUCCESSFULLY ===');
  console.log('Users: 5  | Stories: 3 | Chapters: 8 | Branches: 2 | Spinoffs: 2');
  console.log('Characters: 8 | WikiPages: 4 | Booklists: 3 | ReadingPaths: 3');
  console.log('Comments: 5 | Likes: 8 | Ratings: 5 | Follows: 5');
  console.log('Notifications: 5 | Activities: 5 | Savepoints: 3 | ReadingHistory: 5');
  console.log('ReadingProgress: 3 | ReadingTrails: 2 | Wallets: 3 | Transactions: 3');
  console.log('InteractionStats: 5 | InteractionEvents: 6 | MediaAssets: 2');
  console.log('Moderation: job+decision+audit+case+action | Editorial: change+action');
  console.log('Roles: 4 | Permissions: 21 | SiteConfigs: 5');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
