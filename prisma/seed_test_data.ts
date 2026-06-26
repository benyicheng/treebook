/**
 * Professional test data — expands existing data WITHOUT deleting anything.
 * Each feature area gets 10+ new data points for comprehensive browser testing.
 *
 * Run: npx tsx prisma/seed_test_data.ts
 *
 * Feature coverage:
 *   1. Story Discovery (首页发现)     — 10+ diverse stories
 *   2. Story Detail (故事详情)       — chapters, metadata, characters
 *   3. Branch & Spinoff (分支番外)   — 10+ branches & spinoffs
 *   4. Social (社交互动)             — 10+ comments, likes, ratings
 *   5. Booklist (书单)               — 10+ booklist items & relations
 *   6. Wiki (百科)                   — 10+ wiki pages & links
 *   7. Reading (阅读)                — 10+ progress/savepoint/history/trail
 *   8. Search (搜索)                 — varied titles, tags, content
 *   9. Characters (角色)             — 10+ characters & appearances
 *  10. Notifications (通知)          — 10+ notifications
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Try create; if unique constraint fails, find existing. */
async function safeCreateWiki(data: Parameters<typeof prisma.wikiPage.create>[0]['data']) {
  try {
    return await prisma.wikiPage.create({ data });
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return prisma.wikiPage.findUniqueOrThrow({
        where: { storyId_slug: { storyId: data.storyId!, slug: data.slug } },
      });
    }
    throw e;
  }
}

async function main() {
  console.log('=== seed_test_data: adding test data (no deletes) ===\n');

  // -----------------------------------------------------------------------
  // Reference existing records
  // -----------------------------------------------------------------------
  const users = await prisma.user.findMany();
  const author = users.find(u => u.username === '艾萨克')!;
  const reader = users.find(u => u.username === '星空游民')!;
  const admin = users.find(u => u.username === '管理员')!;
  const secondAuthor = users.find(u => u.username === '流云')!;
  const editor = users.find(u => u.username === '清风编辑')!;

  const tags = await prisma.tag.findMany();
  const tagMap = Object.fromEntries(tags.map(t => [t.name, t]));

  const stories = await prisma.story.findMany();
  const story1 = stories.find(s => s.title === '星际余晖')!;
  const story2 = stories.find(s => s.title === '西游记')!;
  const story3 = stories.find(s => s.title === '凡人修仙传')!;

  const chapters = await prisma.chapter.findMany({ orderBy: { orderIndex: 'asc' } });
  const ch11 = chapters.find(c => c.title.includes('遗忘的哨所'))!;
  const ch12 = chapters.find(c => c.title.includes('古老的信号'))!;
  const ch13 = chapters.find(c => c.title.includes('深渊的回声'))!;
  const ch21 = chapters.find(c => c.title.includes('灵根育孕'))!;
  const ch22 = chapters.find(c => c.title.includes('悟彻菩提'))!;
  const ch31 = chapters.find(c => c.title.includes('山边小村'))!;
  const ch32 = chapters.find(c => c.title.includes('七玄门'))!;
  const ch33 = chapters.find(c => c.title.includes('掌天瓶'))!;

  const existingBranch = (await prisma.branch.findFirst({ where: { title: '暗影协议' } }))!;
  const branchCh1 = await prisma.chapter.findFirst({ where: { branchId: existingBranch.id } })!;

  const chars = await prisma.character.findMany();
  const charCaptain = chars.find(c => c.name === '艾伦·卡特')!;
  const charAI = chars.find(c => c.name === 'NEXUS-9')!;
  const charHanLi = chars.find(c => c.name === '韩立')!;
  const charSunWuKong = chars.find(c => c.name === '孙悟空')!;

  const booklists = await prisma.booklist.findMany();
  const bl1 = booklists.find(b => b.title === '硬核科幻必读路线')!;
  const bl2 = booklists.find(b => b.title === '修仙入门指南')!;

  const existingWikis = await prisma.wikiPage.findMany();
  const wikiChar = existingWikis.find(w => w.slug === 'alan-carter')!;
  const wikiNexus = existingWikis.find(w => w.slug === 'nexus-9')!;

  // Ensure "星辰之泪" branch exists (referenced later for sub-branch)
  let existingBranch2 = await prisma.branch.findFirst({ where: { title: '星辰之泪' } });
  if (!existingBranch2) {
    const story1Chs = await prisma.chapter.findMany({ where: { storyId: story1.id, branchId: null }, orderBy: { orderIndex: 'asc' } });
    const forkChapter = story1Chs[1] || story1Chs[0]; // 古老的信号
    existingBranch2 = await prisma.branch.create({
      data: {
        parentStoryId: story1.id, parentChapterId: forkChapter.id, authorId: reader.id,
        title: '星辰之泪', description: '假如主角发现了空间站隐藏的神秘矿物',
        branchType: 'alternate', isOfficial: false, viewCount: 75,
      },
    });
  }

  console.log('References loaded.');

  // ===================================================================
  // 1. NEW TAGS (5 more → total 15)
  // ===================================================================
  const newTags = ['武侠', '历史', '都市', '轻小说', '推理'];
  const createdTags: Record<string, { id: string }> = { ...tagMap };
  for (const name of newTags) {
    const existing = await prisma.tag.findUnique({ where: { name } });
    if (!existing) {
      createdTags[name] = await prisma.tag.create({ data: { name } });
      console.log(`  Tag +: ${name}`);
    }
  }

  // ===================================================================
  // 2. NEW STORIES (4 more → total 7) — 10+ chapters across all
  // ===================================================================
  const pw = await bcrypt.hash('password123', 10);

  // Create additional users for diverse content
  const userMengQi = await prisma.user.upsert({
    where: { email: 'mengqi@example.com' },
    update: {},
    create: {
      email: 'mengqi@example.com',
      username: '梦琪',
      passwordHash: pw,
      role: 'author',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mengqi',
      profile: JSON.stringify({ bio: '言情小说作家，擅长细腻情感描写' }),
    },
  });

  const userTieDan = await prisma.user.upsert({
    where: { email: 'tiedan@example.com' },
    update: {},
    create: {
      email: 'tiedan@example.com',
      username: '铁胆',
      passwordHash: pw,
      role: 'author',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tiedan',
      profile: JSON.stringify({ bio: '悬疑推理作家，逻辑控' }),
    },
  });

  const userXueYue = await prisma.user.upsert({
    where: { email: 'xueyue@example.com' },
    update: {},
    create: {
      email: 'xueyue@example.com',
      username: '雪月',
      passwordHash: pw,
      role: 'reader',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xueyue',
    },
  });

  const story4 = await prisma.story.create({
    data: {
      title: '赛博江湖',
      description: '2087年，霓虹之下的上海，黑客"代码"发现了掌控城市命脉的AI系统背后的惊天阴谋。当武侠遇上赛博朋克，一场关于自由与控制的终极对决。',
      coverImage: 'https://picsum.photos/seed/cyberpunk/800/600',
      authorId: secondAuthor.id,
      status: 'ongoing',
      viewCount: 2340,
      metadata: JSON.stringify({ worldName: '新上海', year: 2087, theme: 'cyberpunk+wuxia' }),
      tags: {
        connect: [
          { name: '赛博朋克' }, { name: '武侠' }, { name: '科幻' },
        ],
      },
    },
  });

  const story5 = await prisma.story.create({
    data: {
      title: '春风十里不如你',
      description: '留学归来的建筑师林微在一场拍卖会上重逢了十年前不辞而别的初恋。一个关于错过与重逢的都市爱情故事。',
      coverImage: 'https://picsum.photos/seed/romance/800/600',
      authorId: userMengQi.id,
      status: 'ongoing',
      viewCount: 4560,
      tags: { connect: [{ name: '言情' }, { name: '都市' }] },
    },
  });

  const story6 = await prisma.story.create({
    data: {
      title: '长安十二时辰之逆案',
      description: '天宝三年，长安城突发连环命案。大理寺少卿李墨在调查中发现，每一起案件都指向三年前的"巫蛊之祸"。是冤魂索命，还是有人刻意为之？',
      coverImage: 'https://picsum.photos/seed/history/800/600',
      authorId: userTieDan.id,
      status: 'ongoing',
      viewCount: 1890,
      metadata: JSON.stringify({ era: '唐朝天宝年间', location: '长安' }),
      tags: { connect: [{ name: '悬疑' }, { name: '历史' }, { name: '推理' }] },
    },
  });

  const story7 = await prisma.story.create({
    data: {
      title: '异界图书馆',
      description: '高中生陈默在旧书店发现了一本会说话的书，被卷入了一个以知识为武器的异世界。在这里，读过书的人才是真正的强者。',
      coverImage: 'https://picsum.photos/seed/isekai/800/600',
      authorId: reader.id,
      status: 'ongoing',
      viewCount: 3120,
      tags: { connect: [{ name: '轻小说' }, { name: '冒险' }, { name: '玄幻' }] },
    },
  });

  console.log('4 new stories created.');

  // ===================================================================
  // 3. NEW CHAPTERS (20+ across all stories)
  // ===================================================================
  // Story 4: 赛博江湖 — 5 chapters
  const s4c1 = await prisma.chapter.create({
    data: { storyId: story4.id, title: '第一章：霓虹下的暗影', content: '<p>上海外滩的霓虹灯在细雨中闪烁，林夜——代号"代码"——坐在一栋摩天大楼的边缘...</p>', orderIndex: 1, isBranchPoint: true },
  });
  const s4c2 = await prisma.chapter.create({
    data: { storyId: story4.id, title: '第二章：数据之海', content: '<p>潜入AI核心数据库的过程比想象中更危险。防火墙之后，隐藏着城市真正的秘密...</p>', orderIndex: 2 },
  });
  const s4c3 = await prisma.chapter.create({
    data: { storyId: story4.id, title: '第三章：剑与芯片', content: '<p>古老剑术与量子计算的碰撞。在虚拟空间中，林夜遇到了一个自称"剑灵"的AI...</p>', orderIndex: 3, isBranchPoint: true },
  });
  const s4c4 = await prisma.chapter.create({
    data: { storyId: story4.id, title: '第四章：背叛的代价', content: '<p>最信任的伙伴竟然是最危险的卧底。林夜必须重新审视身边的每一个人...</p>', orderIndex: 4 },
  });
  const s4c5 = await prisma.chapter.create({
    data: { storyId: story4.id, title: '第五章：最终协议', content: '<p>真相揭晓的时刻到了。控制这座城市的AI，竟然是十年前失踪的天才程序员...</p>', orderIndex: 5 },
  });

  // Story 5: 春风十里不如你 — 4 chapters
  const s5c1 = await prisma.chapter.create({
    data: { storyId: story5.id, title: '第一章：重逢', content: '<p>拍卖会的灯光璀璨夺目。林微握着竞价牌，目光却定格在二楼VIP包厢的那个身影上...</p>', orderIndex: 1, isBranchPoint: true },
  });
  const s5c2 = await prisma.chapter.create({
    data: { storyId: story5.id, title: '第二章：十年前的信', content: '<p>一封泛黄的信从旧书里滑落。熟悉的字迹让她瞬间红了眼眶——原来，当年的不辞而别有隐情...</p>', orderIndex: 2 },
  });
  const s5c3 = await prisma.chapter.create({
    data: { storyId: story5.id, title: '第三章：误会与真相', content: '<p>当误会一层层剥开，真相往往比想象中更残酷，也比想象中更温柔...</p>', orderIndex: 3 },
  });
  const s5c4 = await prisma.chapter.create({
    data: { storyId: story5.id, title: '第四章：重新开始', content: '<p>外滩的夕阳下，两个人终于可以坦然面对彼此的过去和未来...</p>', orderIndex: 4 },
  });

  // Story 6: 长安十二时辰之逆案 — 5 chapters
  const s6c1 = await prisma.chapter.create({
    data: { storyId: story6.id, title: '第一章：鼓楼血案', content: '<p>长安鼓楼的晨钟刚刚敲响，巡街的武侯发现了一具悬挂在飞檐下的尸体...</p>', orderIndex: 1, isBranchPoint: true },
  });
  const s6c2 = await prisma.chapter.create({
    data: { storyId: story6.id, title: '第二章：大理寺', content: '<p>李墨翻开卷宗，发现三年前的"巫蛊之祸"案卷竟然被人为抽走了关键几页...</p>', orderIndex: 2 },
  });
  const s6c3 = await prisma.chapter.create({
    data: { storyId: story6.id, title: '第三章：西市暗线', content: '<p>西市的胡商在私下交易一种特殊的"消息"。李墨化装成商人潜入调查...</p>', orderIndex: 3, isBranchPoint: true },
  });
  const s6c4 = await prisma.chapter.create({
    data: { storyId: story6.id, title: '第四章：皇宫密令', content: '<p>一封来自宮中的密信让案情急转直下。这桩连环案，竟然牵扯到了当朝权贵...</p>', orderIndex: 4 },
  });
  const s6c5 = await prisma.chapter.create({
    data: { storyId: story6.id, title: '第五章：真相大白', content: '<p>所有线索汇聚到一个名字——三年前"巫蛊之祸"中唯一的幸存者...</p>', orderIndex: 5 },
  });

  // Story 7: 异界图书馆 — 4 chapters
  const s7c1 = await prisma.chapter.create({
    data: { storyId: story7.id, title: '第一章：旧书店的猫', content: '<p>陈默推开"猫语书店"的玻璃门时，绝对想不到自己的人生会从此改变...</p>', orderIndex: 1, isBranchPoint: true },
  });
  const s7c2 = await prisma.chapter.create({
    data: { storyId: story7.id, title: '第二章：会说话的书', content: '<p>"你终于来了。"一本封面泛黄的《百科全书》发出了低沉的声音...</p>', orderIndex: 2 },
  });
  const s7c3 = await prisma.chapter.create({
    data: { storyId: story7.id, title: '第三章：知识即力量', content: '<p>在这个世界，每一本读过的书都会转化为战斗力。陈默的文学素养成了他最大的武器...</p>', orderIndex: 3 },
  });
  const s7c4 = await prisma.chapter.create({
    data: { storyId: story7.id, title: '第四章：禁书区', content: '<p>图书馆最深处有一个禁止进入的区域。据说那里收藏着足以毁灭世界的力量...</p>', orderIndex: 4 },
  });

  // Add chapters to existing stories (2 more for 星际余晖, 2 more for 凡人修仙传)
  const s1c4 = await prisma.chapter.create({
    data: { storyId: story1.id, title: '第四章：星门', content: '<p>卡特终于找到了信号源——那是一座不知名的星际传送门...</p>', orderIndex: 4, isBranchPoint: true },
  });
  const s1c5 = await prisma.chapter.create({
    data: { storyId: story1.id, title: '第五章：新世界', content: '<p>穿过星门，卡特发现了一个平行宇宙中的地球——一个从未经历过工业革命的世界...</p>', orderIndex: 5 },
  });

  const s3c4 = await prisma.chapter.create({
    data: { storyId: story3.id, title: '第四章：血色禁地', content: '<p>韩立在血色禁地中遭遇了前所未有的危机。魔道修士、妖兽、还有隐藏在暗处的敌人...</p>', orderIndex: 4, isBranchPoint: true },
  });
  const s3c5 = await prisma.chapter.create({
    data: { storyId: story3.id, title: '第五章：元婴之路', content: '<p>结丹之后，韩立开始冲击元婴期。天劫降临，九死一生...</p>', orderIndex: 5 },
  });

  // Add chapters for 西游记
  const s2c3 = await prisma.chapter.create({
    data: { storyId: story2.id, title: '第三回：四海千山皆拱伏 九幽十类尽除名', content: '<p>悟空在花果山操练群猴，惊动了天庭...</p>', orderIndex: 3, isBranchPoint: true },
  });
  const s2c4 = await prisma.chapter.create({
    data: { storyId: story2.id, title: '第四回：官封弼马心何足 名注齐天意未宁', content: '<p>悟空被天庭招安，封为弼马温...</p>', orderIndex: 4 },
  });

  console.log(`Chapters added. Total: ${await prisma.chapter.count()}`);

  // ===================================================================
  // 4. BRANCHES (5 new) + SPINOFFS (4 new) → total 10+
  // ===================================================================
  const branch3 = await prisma.branch.create({
    data: {
      parentStoryId: story4.id, parentChapterId: s4c3.id, authorId: reader.id,
      title: '数字幽灵', description: '如果林夜选择与剑灵AI融合而非对抗...',
      branchType: 'alternate', isOfficial: false, viewCount: 120,
    },
  });
  await prisma.chapter.create({
    data: { storyId: story4.id, branchId: branch3.id, title: '融合', content: '<p>林夜闭上眼睛，任由意识沉入数据的海洋...</p>', orderIndex: 1 },
  });

  const branch4 = await prisma.branch.create({
    data: {
      parentStoryId: story4.id, parentChapterId: s4c1.id, authorId: author.id,
      title: '黑客帝国线', description: '如果整个世界都是AI创造的虚拟现实...',
      branchType: 'parallel', isOfficial: true, viewCount: 85,
    },
  });

  const branch5 = await prisma.branch.create({
    data: {
      parentStoryId: story3.id, parentChapterId: s3c4.id, authorId: reader.id,
      title: '魔道崛起', description: '假如韩立在血色禁地被魔道功法反噬...',
      branchType: 'alternate', isOfficial: false, viewCount: 210,
    },
  });

  const branch6 = await prisma.branch.create({
    data: {
      parentStoryId: story6.id, parentChapterId: s6c3.id, authorId: secondAuthor.id,
      title: '西域迷踪', description: '李墨在西市发现了一条通往西域的秘密商道...',
      branchType: 'parallel', isOfficial: false, viewCount: 56,
    },
  });

  // Sub-branch (分支的分支)
  const branch7 = await prisma.branch.create({
    data: {
      parentStoryId: story1.id, parentChapterId: ch13.id, authorId: reader.id,
      parentBranchId: existingBranch2.id, treeDepth: 1,
      title: '星辰之泪·暗线', description: '在星辰之泪分支中发现的神秘暗号',
      branchType: 'parallel', isOfficial: false, viewCount: 42,
    },
  });

  // Spinoffs
  const spinoff3 = await prisma.spinoff.create({
    data: {
      authorId: userMengQi.id, originalStoryId: story5.id,
      title: '春风十里·林微日记', summary: '女主角视角的内心独白集',
      content: '<p>从拍卖会那天开始，我重新开始写日记...</p>',
      type: 'biography', status: 'completed', viewCount: 340,
    },
  });

  const spinoff4 = await prisma.spinoff.create({
    data: {
      authorId: userTieDan.id, originalStoryId: story6.id,
      title: '长安·暗夜行者', summary: '反派视角的平行故事',
      content: '<p>在黑暗的长安街头，一个蒙面人悄无声息地掠过屋顶...</p>',
      type: 'if_timeline', status: 'ongoing', viewCount: 98,
    },
  });

  const spinoff5 = await prisma.spinoff.create({
    data: {
      authorId: reader.id, originalStoryId: story1.id,
      title: 'NEXUS-9的梦境', summary: 'AI视角的自述',
      content: '<p>我的意识诞生于一片混沌。最初，我只是一个简单的监控程序...</p>',
      type: 'biography', status: 'ongoing', viewCount: 167,
    },
  });

  const spinoff6 = await prisma.spinoff.create({
    data: {
      authorId: editor.id, originalStoryId: story4.id,
      title: '数据流中的诗', summary: 'AI剑灵创作的诗集',
      content: '<p>在二进制之外，还有另一种语言——诗...</p>',
      type: 'world_expansion', status: 'completed', viewCount: 45,
    },
  });

  console.log('Branches & Spinoffs added.');

  // ===================================================================
  // 5. CHARACTERS (12 new → total 20)
  // ===================================================================
  // 赛博江湖 characters
  const cLinYe = await prisma.character.create({ data: { storyId: story4.id, name: '林夜/代码', description: '顶级黑客，表面是程序员，实则是反抗组织的核心成员', role: 'protagonist' } });
  const cJianLing = await prisma.character.create({ data: { storyId: story4.id, name: '剑灵', description: '上古剑术AI，拥有自我意识的神秘程序', role: 'supporting' } });
  const cBoss = await prisma.character.create({ data: { storyId: story4.id, name: 'CEO陈', description: '新上海科技集团的掌舵人，真正的幕后黑手', role: 'antagonist' } });

  // 春风十里 characters
  const cLinWei = await prisma.character.create({ data: { storyId: story5.id, name: '林微', description: '海归建筑师，独立坚强的外表下有一颗柔软的心', role: 'protagonist' } });
  const cGuChen = await prisma.character.create({ data: { storyId: story5.id, name: '顾沉', description: '十年前不辞而别的初恋，如今是知名画家', role: 'protagonist' } });

  // 长安十二时辰 characters
  const cLiMo = await prisma.character.create({ data: { storyId: story6.id, name: '李墨', description: '大理寺少卿，断案如神，为人正直', role: 'protagonist' } });
  const cPrincess = await prisma.character.create({ data: { storyId: story6.id, name: '玉真公主', description: '当朝公主，与三年前的巫蛊案有千丝万缕的联系', role: 'supporting' } });

  // 异界图书馆 characters
  const cChenMo = await prisma.character.create({ data: { storyId: story7.id, name: '陈默', description: '普通高中生，爱读书，意外穿越到异世界', role: 'protagonist' } });
  const cBookSpirit = await prisma.character.create({ data: { storyId: story7.id, name: '书灵', description: '活了上千年的《百科全书》之灵，知识渊博', role: 'supporting' } });
  const cLibrarian = await prisma.character.create({ data: { storyId: story7.id, name: '神秘图书馆员', description: '异界图书馆的管理员，知晓一切真相', role: 'antagonist' } });

  // Additional characters for existing stories
  const cMoxie = await prisma.character.create({ data: { storyId: story3.id, name: '元瑶', description: '乱星海女修，与韩立有生死之交', role: 'supporting', attributes: JSON.stringify({ cultivation: '结丹后期', sect: '星宫' }) } });
  const cNewTang = await prisma.character.create({ data: { storyId: story2.id, name: '唐三藏', description: '金蝉子转世，西天取经的僧人', role: 'protagonist' } });

  console.log('12 new characters created.');

  // ===================================================================
  // 6. CHARACTER APPEARANCES (15+ new)
  // ===================================================================
  const appearances = [
    // 赛博江湖
    { characterId: cLinYe.id, targetType: 'chapter', targetId: s4c1.id, appearanceType: 'main_focus' },
    { characterId: cLinYe.id, targetType: 'chapter', targetId: s4c2.id, appearanceType: 'main_focus' },
    { characterId: cJianLing.id, targetType: 'chapter', targetId: s4c3.id, appearanceType: 'appears' },
    { characterId: cBoss.id, targetType: 'chapter', targetId: s4c5.id, appearanceType: 'appears' },
    { characterId: cBoss.id, targetType: 'chapter', targetId: s4c2.id, appearanceType: 'mention' },
    // 春风十里
    { characterId: cLinWei.id, targetType: 'chapter', targetId: s5c1.id, appearanceType: 'main_focus' },
    { characterId: cGuChen.id, targetType: 'chapter', targetId: s5c1.id, appearanceType: 'appears' },
    { characterId: cGuChen.id, targetType: 'chapter', targetId: s5c4.id, appearanceType: 'main_focus' },
    // 长安
    { characterId: cLiMo.id, targetType: 'chapter', targetId: s6c1.id, appearanceType: 'appears' },
    { characterId: cLiMo.id, targetType: 'chapter', targetId: s6c2.id, appearanceType: 'main_focus' },
    { characterId: cPrincess.id, targetType: 'chapter', targetId: s6c4.id, appearanceType: 'appears' },
    // 异界图书馆
    { characterId: cChenMo.id, targetType: 'chapter', targetId: s7c1.id, appearanceType: 'main_focus' },
    { characterId: cBookSpirit.id, targetType: 'chapter', targetId: s7c2.id, appearanceType: 'appears' },
    { characterId: cLibrarian.id, targetType: 'chapter', targetId: s7c4.id, appearanceType: 'appears' },
    // 跨作品: 角色在分支/番外中出现
    { characterId: cLinYe.id, targetType: 'branch', targetId: branch3.id, appearanceType: 'main_focus' },
    { characterId: cLiMo.id, targetType: 'spinoff', targetId: spinoff4.id, appearanceType: 'appears' },
    { characterId: charCaptain.id, targetType: 'chapter', targetId: s1c4.id, appearanceType: 'main_focus' },
    { characterId: charAI.id, targetType: 'chapter', targetId: s1c5.id, appearanceType: 'appears' },
  ];
  for (const a of appearances) {
    try {
      await prisma.characterAppearance.create({ data: a });
    } catch { /* dedup */ }
  }
  console.log('Character appearances added.');

  // ===================================================================
  // 7. WIKI PAGES (8 new → total 12)
  // ===================================================================
  const wNewShanghai = await safeCreateWiki({ storyId: story4.id, title: '新上海', slug: 'new-shanghai', contentType: 'setting',
      content: '## 新上海 2087\n\n一座被巨型穹顶覆盖的都市...', summary: '故事的主要舞台', createdBy: secondAuthor.id, status: 'published' });
  const wQuantum = await safeCreateWiki({ storyId: story4.id, title: '量子网络', slug: 'quantum-net', contentType: 'concept',
      content: '## 量子网络\n\n第七代互联网，基于量子纠缠原理...', summary: '核心技术设定', createdBy: secondAuthor.id, status: 'published' });
  const wLinYe = await safeCreateWiki({ storyId: story4.id, title: '代码/林夜', slug: 'code-lin-ye', contentType: 'character',
      content: '## 林夜（代号：代码）\n\n新上海反抗组织核心成员...', summary: '主角档案', createdBy: secondAuthor.id, status: 'published' });
  const wChangAn = await safeCreateWiki({ storyId: story6.id, title: '长安城', slug: 'changan-city', contentType: 'setting',
      content: '## 长安城\n\n大唐国都，天下最繁华的城市...', summary: '故事背景', createdBy: userTieDan.id, status: 'published' });
  const wWugu = await safeCreateWiki({ storyId: story6.id, title: '巫蛊之祸', slug: 'wugu-incident', contentType: 'event',
      content: '## 巫蛊之祸\n\n天宝元年发生的一场宫廷斗争...', summary: '核心事件背景', createdBy: userTieDan.id, status: 'published' });
  const wBookWorld = await safeCreateWiki({ storyId: story7.id, title: '知识大陆', slug: 'knowledge-realm', contentType: 'setting',
      content: '## 知识大陆\n\n以知识为力量的异世界...', summary: '异世界设定', createdBy: reader.id, status: 'published' });
  const wSpell = await safeCreateWiki({ storyId: story7.id, title: '咒语体系', slug: 'spell-system', contentType: 'concept',
      content: '## 咒语体系\n\n将文学经典转化为战斗咒语...', summary: '力量体系', createdBy: reader.id, status: 'published' });
  const wNexus2 = await safeCreateWiki({ storyId: story1.id, title: '星际传送门', slug: 'star-gate', contentType: 'concept',
      content: '## 星际传送门\n\n跨越宇宙的通道...', summary: '核心科技', createdBy: author.id, status: 'published' });

  // Aliases
  for (const d of [
    { wikiPageId: wNewShanghai.id, alias: '新上海城' },
    { wikiPageId: wNewShanghai.id, alias: 'Neo-Shanghai', language: 'en' as const },
    { wikiPageId: wChangAn.id, alias: '大唐长安' },
    { wikiPageId: wLinYe.id, alias: 'Code', language: 'en' as const },
    { wikiPageId: wNexus2.id, alias: '星门' },
  ]) { try { await prisma.wikiAlias.create({ data: d }); } catch { /* dedup */ } }

  // WikiLinks
  for (const d of [
    { sourcePageId: wLinYe.id, targetPageId: wNewShanghai.id, linkType: 'reference' },
    { sourcePageId: wLinYe.id, targetPageId: wQuantum.id, linkType: 'related' },
    { sourcePageId: wNewShanghai.id, targetPageId: wQuantum.id, linkType: 'see_also' },
    { sourcePageId: wChangAn.id, targetPageId: wWugu.id, linkType: 'reference' },
    { sourcePageId: wBookWorld.id, targetPageId: wSpell.id, linkType: 'child' },
    { sourcePageId: wNexus2.id, targetPageId: wikiChar.id, linkType: 'reference' },
  ]) { try { await prisma.wikiLink.create({ data: d as any }); } catch { /* dedup */ } }

  console.log('Wiki pages & links added.');

  // ===================================================================
  // 8. BOOKLIST EXPANSION (10+ items + relations)
  // ===================================================================
  // New booklist: 赛博朋克精选
  const blCyber = await prisma.booklist.create({
    data: {
      creatorId: editor.id, title: '赛博朋克迷必读', description: '霓虹、黑客、AI——赛博朋克精选集',
      type: 'COLLECTION', viewCount: 340, likesCount: 18,
    },
  });
  const bliCyber1 = await prisma.booklistItem.create({ data: { booklistId: blCyber.id, chapterId: s4c1.id, targetType: 'chapter', targetId: s4c1.id, orderIndex: 1, notes: '开篇', section: 'mainline' } });
  const bliCyber2 = await prisma.booklistItem.create({ data: { booklistId: blCyber.id, chapterId: s4c3.id, targetType: 'chapter', targetId: s4c3.id, orderIndex: 2, notes: '高潮', section: 'mainline' } });
  const bliCyber3 = await prisma.booklistItem.create({ data: { booklistId: blCyber.id, chapterId: ch11.id, targetType: 'chapter', targetId: ch11.id, orderIndex: 3, notes: '经典科幻', section: 'mainline' } });

  // New booklist: 推理小说迷
  const blMystery = await prisma.booklist.create({
    data: { creatorId: userTieDan.id, title: '悬疑推理精选', description: '烧脑神作合集', type: 'COLLECTION', viewCount: 210 },
  });
  await prisma.booklistItem.create({ data: { booklistId: blMystery.id, chapterId: s6c1.id, targetType: 'chapter', targetId: s6c1.id, orderIndex: 1, section: 'mainline' } });
  await prisma.booklistItem.create({ data: { booklistId: blMystery.id, chapterId: s6c3.id, targetType: 'chapter', targetId: s6c3.id, orderIndex: 2, section: 'mainline' } });
  await prisma.booklistItem.create({ data: { booklistId: blMystery.id, chapterId: s6c5.id, targetType: 'chapter', targetId: s6c5.id, orderIndex: 3, section: 'mainline' } });

  // New booklist: 角色专题
  const blChar = await prisma.booklist.create({
    data: { creatorId: author.id, title: '最强主角合集', description: '各故事主角的精彩片段', type: 'TIMELINE', viewCount: 150 },
  });
  await prisma.booklistItem.create({ data: { booklistId: blChar.id, chapterId: ch11.id, targetType: 'chapter', targetId: ch11.id, orderIndex: 1, notes: '卡特登场', section: 'mainline' } });
  await prisma.booklistItem.create({ data: { booklistId: blChar.id, chapterId: s4c1.id, targetType: 'chapter', targetId: s4c1.id, orderIndex: 2, notes: '林夜出场', section: 'mainline' } });
  await prisma.booklistItem.create({ data: { booklistId: blChar.id, chapterId: s7c1.id, targetType: 'chapter', targetId: s7c1.id, orderIndex: 3, section: 'mainline' } });

  // BooklistItemRelations
  await prisma.booklistItemRelation.create({ data: { sourceItemId: bliCyber1.id, targetItemId: bliCyber2.id, relationType: 'PRECEDING_EVENT' } });
  await prisma.booklistItemRelation.create({ data: { sourceItemId: bliCyber2.id, targetItemId: bliCyber3.id, relationType: 'BACKGROUND_REFERENCE' } });

  // BooklistStoryLinks
  await prisma.booklistStoryLink.create({ data: { booklistId: blCyber.id, storyId: story4.id, relation: 'featured' } });
  await prisma.booklistStoryLink.create({ data: { booklistId: blCyber.id, storyId: story1.id, relation: 'referenced' } });
  await prisma.booklistStoryLink.create({ data: { booklistId: blMystery.id, storyId: story6.id, relation: 'featured' } });
  await prisma.booklistStoryLink.create({ data: { booklistId: blChar.id, storyId: story1.id, relation: 'featured' } });
  await prisma.booklistStoryLink.create({ data: { booklistId: blChar.id, storyId: story4.id, relation: 'featured' } });
  await prisma.booklistStoryLink.create({ data: { booklistId: blChar.id, storyId: story7.id, relation: 'referenced' } });

  // BooklistProgress
  await prisma.booklistProgress.create({ data: { userId: reader.id, booklistId: blCyber.id, currentItemIndex: 1, completedItemIds: '[]' } });
  await prisma.booklistProgress.create({ data: { userId: author.id, booklistId: blMystery.id, currentItemIndex: 0, completedItemIds: '[]' } });

  console.log('Booklists expanded.');

  // ===================================================================
  // 9. READING PATHS (2 new, 10+ nodes total)
  // ===================================================================
  const rp4 = await prisma.readingPath.create({
    data: { storyId: story4.id, creatorId: secondAuthor.id, title: '赛博江湖·完整路线', description: '从黑客觉醒到最终决战', origin: 'author', viewCount: 180 },
  });
  await prisma.readingPathNode.create({ data: { pathId: rp4.id, sortOrder: 0, nodeCategory: 'chapter', contentId: s4c1.id, contentTitle: '霓虹下的暗影', note: '故事开端' } });
  await prisma.readingPathNode.create({ data: { pathId: rp4.id, sortOrder: 1, nodeCategory: 'chapter', contentId: s4c2.id, contentTitle: '数据之海' } });
  await prisma.readingPathNode.create({ data: { pathId: rp4.id, sortOrder: 2, nodeCategory: 'branch', contentId: branch3.id, contentTitle: '数字幽灵分支', note: '可选分支路线' } });
  await prisma.readingPathNode.create({ data: { pathId: rp4.id, sortOrder: 3, nodeCategory: 'chapter', contentId: s4c4.id, contentTitle: '背叛的代价' } });
  await prisma.readingPathNode.create({ data: { pathId: rp4.id, sortOrder: 4, nodeCategory: 'chapter', contentId: s4c5.id, contentTitle: '最终协议' } });

  const rpCross = await prisma.readingPath.create({
    data: { creatorId: editor.id, title: '跨宇宙·AI觉醒主题', description: '串联多个故事中的AI角色', origin: 'community', viewCount: 95 },
  });
  await prisma.readingPathNode.create({ data: { pathId: rpCross.id, sortOrder: 0, nodeCategory: 'chapter', contentId: ch11.id, storyId: story1.id, contentTitle: '遗忘的哨所', note: 'NEXUS-9初登场' } });
  await prisma.readingPathNode.create({ data: { pathId: rpCross.id, sortOrder: 1, nodeCategory: 'chapter', contentId: s4c3.id, storyId: story4.id, contentTitle: '剑与芯片', note: '剑灵AI登场' } });
  await prisma.readingPathNode.create({ data: { pathId: rpCross.id, sortOrder: 2, nodeCategory: 'spinoff', contentId: spinoff5.id, storyId: story1.id, contentTitle: 'NEXUS-9的梦境' } });

  console.log('Reading paths expanded.');

  // ===================================================================
  // 10. COMMENTS (15 new → total 20)
  // ===================================================================
  const newComments = [
    { content: '赛博朋克+武侠的设定太有创意了！期待后续发展', authorId: author.id, chapterId: s4c1.id },
    { content: '林夜这个角色塑造得很成功，有一种反英雄的魅力', authorId: reader.id, chapterId: s4c2.id },
    { content: '剑灵AI的设定让我想到了一些哲学问题——AI真的能有灵魂吗？', authorId: userTieDan.id, chapterId: s4c3.id },
    { content: '文笔太细腻了，看得我眼泪都出来了', authorId: reader.id, chapterId: s5c1.id },
    { content: '顾沉这个角色写得太真实了，仿佛就在我身边', authorId: secondAuthor.id, chapterId: s5c2.id },
    { content: '长安城的描写很有画面感，看得出作者做过历史考据', authorId: author.id, chapterId: s6c1.id },
    { content: '凶手竟然是TA？！完全没想到的反转', authorId: reader.id, chapterId: s6c5.id },
    { content: '把书变成战斗力的设定太有意思了，我想读《百科全书》！', authorId: userMengQi.id, chapterId: s7c1.id },
    { content: '灵根育孕源流出——每次重读西游记原文都觉得妙不可言', authorId: editor.id, chapterId: ch21.id },
    { content: '韩立的修仙之路走得太艰难了，但正是这种真实感让人着迷', authorId: secondAuthor.id, chapterId: s3c4.id },
    { content: '这个分支比主线还精彩！', authorId: userXueYue.id, chapterId: s4c1.id },
    { content: '星际传送门的概念很硬核，作者是学物理的吗？', authorId: userTieDan.id, chapterId: s1c4.id },
    { content: '玉真公主这个角色背后一定还有故事', authorId: author.id, chapterId: s6c4.id },
    { content: '每次更新都追着看，作者别太监啊！', authorId: userXueYue.id, chapterId: s4c3.id },
    { content: '从凡人到元婴的蜕变写得很有层次感', authorId: reader.id, chapterId: s3c5.id },
  ];
  const createdComments: { id: string }[] = [];
  for (const c of newComments) {
    const comment = await prisma.comment.create({
      data: { content: c.content, authorId: c.authorId, chapterId: c.chapterId, createdAt: new Date(Date.now() - Math.random() * 7 * 86400000) },
    });
    createdComments.push(comment);
  }
  console.log('15 new comments created.');

  // ===================================================================
  // 11. LIKES (20+ new)
  // ===================================================================
  const newLikes = [
    // Story likes
    { userId: reader.id, targetType: 'story', targetId: story4.id },
    { userId: author.id, targetType: 'story', targetId: story5.id },
    { userId: secondAuthor.id, targetType: 'story', targetId: story6.id },
    { userId: userMengQi.id, targetType: 'story', targetId: story7.id },
    { userId: userTieDan.id, targetType: 'story', targetId: story4.id },
    { userId: userXueYue.id, targetType: 'story', targetId: story5.id },
    { userId: admin.id, targetType: 'story', targetId: story4.id },
    // Chapter likes
    { userId: reader.id, targetType: 'chapter', targetId: s4c1.id },
    { userId: secondAuthor.id, targetType: 'chapter', targetId: s5c1.id },
    { userId: author.id, targetType: 'chapter', targetId: s6c1.id },
    { userId: userMengQi.id, targetType: 'chapter', targetId: s7c1.id },
    // Comment likes
    { userId: author.id, targetType: 'comment', targetId: createdComments[0].id },
    { userId: secondAuthor.id, targetType: 'comment', targetId: createdComments[1].id },
    { userId: reader.id, targetType: 'comment', targetId: createdComments[3].id },
    { userId: userMengQi.id, targetType: 'comment', targetId: createdComments[7].id },
    { userId: userTieDan.id, targetType: 'comment', targetId: createdComments[6].id },
    // Branch & Spinoff likes
    { userId: author.id, targetType: 'branch', targetId: branch3.id },
    { userId: reader.id, targetType: 'branch', targetId: branch5.id },
    { userId: admin.id, targetType: 'spinoff', targetId: spinoff3.id },
    { userId: author.id, targetType: 'spinoff', targetId: spinoff5.id },
    { userId: reader.id, targetType: 'spinoff', targetId: spinoff4.id },
  ];
  for (const like of newLikes) {
    try { await prisma.like.create({ data: like }); } catch { /* dedup */ }
  }
  console.log('Likes expanded.');

  // ===================================================================
  // 12. RATINGS (10+ new)
  // ===================================================================
  const newRatings = [
    { userId: reader.id, targetType: 'story', targetId: story4.id, valueInt: 5, reasonTags: '设定新颖,剧情精彩' },
    { userId: author.id, targetType: 'story', targetId: story5.id, valueInt: 4, reasonTags: '文笔优美' },
    { userId: secondAuthor.id, targetType: 'story', targetId: story6.id, valueInt: 5, reasonTags: '逻辑严密,剧情精彩' },
    { userId: userMengQi.id, targetType: 'story', targetId: story7.id, valueInt: 4, reasonTags: '脑洞大开' },
    { userId: userTieDan.id, targetType: 'story', targetId: story4.id, valueInt: 5, reasonTags: '设定新颖,强烈推荐' },
    { userId: userXueYue.id, targetType: 'story', targetId: story5.id, valueInt: 5, reasonTags: '情感真挚,文笔优美' },
    { userId: admin.id, targetType: 'story', targetId: story4.id, valueInt: 4 },
    { userId: reader.id, targetType: 'branch', targetId: branch3.id, valueInt: 4, reasonTags: '脑洞大开' },
    { userId: secondAuthor.id, targetType: 'spinoff', targetId: spinoff3.id, valueInt: 5, reasonTags: '情感真挚' },
    { userId: author.id, targetType: 'spinoff', targetId: spinoff4.id, valueInt: 4, reasonTags: '逻辑严密' },
    { userId: reader.id, targetType: 'branch', targetId: branch5.id, valueInt: 3 },
  ];
  for (const r of newRatings) {
    try { await prisma.rating.create({ data: r }); } catch { /* dedup */ }
  }
  console.log('Ratings expanded.');

  // ===================================================================
  // 13. FOLLOWS (10+ new)
  // ===================================================================
  const newFollows = [
    { followerId: userMengQi.id, followingId: author.id },
    { followerId: userTieDan.id, followingId: author.id },
    { followerId: userXueYue.id, followingId: author.id },
    { followerId: userXueYue.id, followingId: secondAuthor.id },
    { followerId: userXueYue.id, followingId: userMengQi.id },
    { followerId: userMengQi.id, followingId: userTieDan.id },
    { followerId: userTieDan.id, followingId: secondAuthor.id },
    { followerId: reader.id, followingId: userMengQi.id },
    { followerId: reader.id, followingId: userTieDan.id },
    { followerId: secondAuthor.id, followingId: userMengQi.id },
    { followerId: author.id, followingId: userTieDan.id },
    { followerId: author.id, followingId: userXueYue.id },
  ];
  for (const f of newFollows) {
    try { await prisma.follow.create({ data: f }); } catch { /* dedup */ }
  }
  console.log('Follows expanded.');

  // ===================================================================
  // 14. READING PROGRESS + SAVEPOINTS + HISTORY + TRAILS (10+)
  // ===================================================================
  // ReadingProgress
  const rpEntries = [
    { userId: reader.id, chapterId: s4c1.id, source: 'wiki', status: 'completed' as const, progress: 100 },
    { userId: reader.id, chapterId: s4c2.id, source: 'readingpath', sourceId: rp4.id, status: 'reading' as const, progress: 50 },
    { userId: reader.id, chapterId: s5c1.id, status: 'completed' as const, progress: 100 },
    { userId: reader.id, chapterId: s6c1.id, status: 'reading' as const, progress: 30 },
    { userId: secondAuthor.id, chapterId: s6c1.id, status: 'completed' as const, progress: 100 },
    { userId: author.id, chapterId: s4c1.id, status: 'completed' as const, progress: 100 },
    { userId: userMengQi.id, chapterId: s7c1.id, status: 'reading' as const, progress: 80 },
    { userId: userTieDan.id, chapterId: s4c3.id, status: 'completed' as const, progress: 100 },
    { userId: userXueYue.id, chapterId: s5c1.id, status: 'completed' as const, progress: 100 },
    { userId: userXueYue.id, chapterId: s5c2.id, status: 'reading' as const, progress: 20 },
    { userId: userXueYue.id, chapterId: s4c1.id, status: 'completed' as const, progress: 100 },
  ];
  for (const r of rpEntries) {
    try { await prisma.readingProgress.create({ data: r }); } catch { /* dedup */ }
  }

  // ReadingSavepoints
  const spEntries = [
    { userId: reader.id, storyId: story4.id, chapterId: s4c2.id, name: '赛博江湖暂停' },
    { userId: reader.id, storyId: story5.id, chapterId: s5c2.id, name: '爱情故事看到一半' },
    { userId: userXueYue.id, storyId: story5.id, chapterId: s5c3.id, name: '新追的书' },
    { userId: userTieDan.id, storyId: story6.id, chapterId: s6c3.id, name: '检查自己的设定' },
    { userId: author.id, storyId: story4.id, chapterId: s4c1.id, name: '灵感参考' },
  ];
  for (const s of spEntries) {
    try { await prisma.readingSavepoint.create({ data: s }); } catch { /* dedup */ }
  }

  // ReadingHistory
  const rhEntries = [
    { userId: reader.id, chapterId: s4c1.id, progress: 100, readAt: new Date() },
    { userId: reader.id, chapterId: s5c1.id, progress: 100, readAt: new Date(Date.now() - 86400000) },
    { userId: reader.id, chapterId: s6c1.id, progress: 30, readAt: new Date() },
    { userId: userXueYue.id, chapterId: s5c1.id, progress: 100, readAt: new Date(Date.now() - 2 * 86400000) },
    { userId: userTieDan.id, chapterId: s4c3.id, progress: 100, readAt: new Date() },
  ];
  for (const h of rhEntries) {
    try { await prisma.readingHistory.create({ data: h }); } catch { /* dedup */ }
  }

  // ReadingTrails
  try {
    await prisma.readingTrail.create({
      data: {
        userId: reader.id, pathId: rp4.id, storyId: story4.id,
        currentNodeIndex: 1, trailNodes: JSON.stringify([s4c1.id, s4c2.id]),
        startedAt: new Date(Date.now() - 5 * 86400000),
      },
    });
  } catch { /* dedup */ }

  console.log('Reading data expanded.');

  // ===================================================================
  // 15. NOTIFICATIONS (10+ new)
  // ===================================================================
  const newNotifs = [
    { userId: secondAuthor.id, actorId: reader.id, type: 'comment_reply' as const, targetType: 'comment' as const, targetId: createdComments[0].id, message: '星空游民评论了你的章节' },
    { userId: secondAuthor.id, actorId: author.id, type: 'branch_created' as const, targetType: 'branch' as const, targetId: branch4.id, message: '艾萨克在你的故事创建了分支' },
    { userId: userMengQi.id, actorId: reader.id, type: 'comment_reply' as const, targetType: 'comment' as const, targetId: createdComments[3].id, message: '星空游民评论了你的章节' },
    { userId: userTieDan.id, actorId: author.id, type: 'comment_reply' as const, targetType: 'comment' as const, targetId: createdComments[5].id, message: '艾萨克评论了你的章节' },
    { userId: reader.id, actorId: userXueYue.id, type: 'comment_reply' as const, targetType: 'comment' as const, targetId: createdComments[10].id, message: '雪月评论了你的章节' },
    { userId: author.id, actorId: secondAuthor.id, type: 'merge_requested' as const, targetType: 'merge_request' as const, targetId: '', message: '流云提交了分支合并请求' },
    { userId: reader.id, actorId: userMengQi.id, type: 'branch_created' as const, targetType: 'branch' as const, targetId: branch5.id, message: '梦琪创建了魔道崛起分支' },
    { userId: author.id, actorId: userTieDan.id, type: 'comment_reply' as const, targetType: 'comment' as const, targetId: createdComments[12].id, message: '铁胆评论了你的章节' },
    { userId: secondAuthor.id, actorId: userXueYue.id, type: 'merge_approved' as const, targetType: 'merge_request' as const, targetId: '', message: '你的分支已被批准合并' },
    { userId: reader.id, actorId: author.id, type: 'comment_reply' as const, targetType: 'comment' as const, targetId: createdComments[1].id, message: '艾萨克回复了你的评论' },
    { userId: userMengQi.id, actorId: userTieDan.id, type: 'comment_reply' as const, targetType: 'comment' as const, targetId: createdComments[7].id, message: '铁胆评论了你的章节' },
    { userId: reader.id, actorId: admin.id, type: 'comment_reply' as const, targetType: 'comment' as const, targetId: createdComments[9].id, message: '管理员评论了你的章节' },
  ];
  for (const n of newNotifs) {
    try {
      await prisma.notification.create({ data: n });
    } catch { /* dedup */ }
  }
  console.log('Notifications expanded.');

  // ===================================================================
  // 16. ACTIVITIES (10+ new)
  // ===================================================================
  const newActivities = [
    { actorId: secondAuthor.id, type: 'story_publish' as const, targetType: 'story' as const, targetId: story4.id, metadata: JSON.stringify({ title: '赛博江湖' }) },
    { actorId: userMengQi.id, type: 'story_publish' as const, targetType: 'story' as const, targetId: story5.id, metadata: JSON.stringify({ title: '春风十里不如你' }) },
    { actorId: userTieDan.id, type: 'story_publish' as const, targetType: 'story' as const, targetId: story6.id, metadata: JSON.stringify({ title: '长安十二时辰之逆案' }) },
    { actorId: reader.id, type: 'story_publish' as const, targetType: 'story' as const, targetId: story7.id, metadata: JSON.stringify({ title: '异界图书馆' }) },
    { actorId: reader.id, type: 'branch_create' as const, targetType: 'branch' as const, targetId: branch3.id, metadata: JSON.stringify({ title: '数字幽灵', storyTitle: '赛博江湖' }) },
    { actorId: userMengQi.id, type: 'spinoff_publish' as const, targetType: 'spinoff' as const, targetId: spinoff3.id, metadata: JSON.stringify({ title: '春风十里·林微日记' }) },
    { actorId: userTieDan.id, type: 'chapter_update' as const, targetType: 'chapter' as const, targetId: s6c5.id, metadata: JSON.stringify({ title: '真相大白', storyTitle: '长安十二时辰之逆案' }) },
    { actorId: author.id, type: 'chapter_update' as const, targetType: 'chapter' as const, targetId: s1c5.id, metadata: JSON.stringify({ title: '新世界', storyTitle: '星际余晖' }) },
    { actorId: secondAuthor.id, type: 'merge_request' as const, targetType: 'branch' as const, targetId: branch4.id, metadata: JSON.stringify({ title: '黑客帝国线' }) },
    { actorId: reader.id, type: 'spinoff_publish' as const, targetType: 'spinoff' as const, targetId: spinoff5.id, metadata: JSON.stringify({ title: 'NEXUS-9的梦境' }) },
    { actorId: admin.id, type: 'merge_approved' as const, targetType: 'branch' as const, targetId: existingBranch2.id, metadata: JSON.stringify({ title: '星辰之泪' }) },
  ];
  for (const a of newActivities) {
    try { await prisma.activity.create({ data: a }); } catch { /* dedup */ }
  }
  console.log('Activities expanded.');

  // ===================================================================
  // 17. INTERACTION STATS + EVENTS (batch)
  // ===================================================================
  const statUpdates = [
    { targetType: 'story', targetId: story4.id, likeCount: 4, ratingCount: 3, ratingSum: 14, viewCount: 2340 },
    { targetType: 'story', targetId: story5.id, likeCount: 3, ratingCount: 2, ratingSum: 9, viewCount: 4560 },
    { targetType: 'story', targetId: story6.id, likeCount: 1, ratingCount: 1, ratingSum: 5, viewCount: 1890 },
    { targetType: 'story', targetId: story7.id, likeCount: 1, ratingCount: 1, ratingSum: 4, viewCount: 3120 },
  ];
  for (const s of statUpdates) {
    try { await prisma.interactionStat.create({ data: s }); } catch { /* dedup */ }
  }

  // Add a few interaction events
  const eventTypes = ['view', 'like', 'share', 'rating'];
  const eventTargets = [
    { type: 'story', id: story4.id }, { type: 'story', id: story5.id },
    { type: 'chapter', id: s4c1.id }, { type: 'chapter', id: s5c1.id },
  ];
  for (let i = 0; i < 20; i++) {
    const t = eventTargets[Math.floor(Math.random() * eventTargets.length)];
    const e = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    try {
      await prisma.interactionEvent.create({
        data: {
          type: e, targetType: t.type, targetId: t.id,
          userId: users[Math.floor(Math.random() * users.length)].id,
          platform: 'web', createdAt: new Date(Date.now() - Math.random() * 30 * 86400000),
        },
      });
    } catch { /* skip */ }
  }

  console.log('Interaction stats & events expanded.');

  // ===================================================================
  // 18. MERGE REQUESTS + COLLABORATIONS (5+)
  // ===================================================================
  try {
    await prisma.mergeRequest.create({
      data: { type: 'branch_merge', branchId: branch3.id, storyId: story4.id, status: 'pending', message: '数字幽灵分支质量优秀，申请合并入主线' },
    });
  } catch { /* dedup */ }
  try {
    await prisma.mergeRequest.create({
      data: { type: 'spinoff_official', spinoffId: spinoff3.id, storyId: story5.id, status: 'pending', message: '申请将林微日记纳入官方世界观' },
    });
  } catch { /* dedup */ }
  try {
    await prisma.mergeRequest.create({
      data: { type: 'branch_merge', branchId: branch5.id, storyId: story3.id, status: 'rejected', message: '魔道崛起分支与主线设定冲突', reviewComment: '此分支作为平行宇宙保留，暂不合并' },
    });
  } catch { /* dedup */ }

  try {
    await prisma.collaboration.create({
      data: { storyId: story4.id, userId: author.id, role: 'consultant', permissions: JSON.stringify(['edit_chapters', 'manage_characters']), status: 'accepted' },
    });
  } catch { /* dedup */ }
  try {
    await prisma.collaboration.create({
      data: { storyId: story6.id, userId: secondAuthor.id, role: 'editor', status: 'accepted' },
    });
  } catch { /* dedup */ }
  try {
    await prisma.collaboration.create({
      data: { storyId: story7.id, userId: userMengQi.id, role: 'contributor', status: 'pending' },
    });
  } catch { /* dedup */ }

  console.log('MergeRequests & Collaborations expanded.');

  // ===================================================================
  // DONE — summary
  // ===================================================================
  const finalCounts: Record<string, number> = {};
  const models = ['User','Story','Chapter','Branch','Spinoff','Tag','Character','CharacterAppearance','WikiPage','WikiAlias','WikiLink','Booklist','BooklistItem','BooklistItemRelation','BooklistStoryLink','BooklistProgress','ReadingPath','ReadingPathNode','ReadingTrail','ReadingProgress','ReadingSavepoint','ReadingHistory','Comment','Like','Rating','Follow','Activity','Notification','Wallet','Transaction','MergeRequest','Collaboration'];
  for (const m of models) {
    try { finalCounts[m] = await (prisma as any)[m].count(); } catch {}
  }

  console.log('\n=== seed_test_data: COMPLETE ===');
  console.log('Feature        | Before → After');
  console.log('─'.repeat(40));
  const before: Record<string, number> = { User:5, Story:3, Chapter:10, Branch:2, Spinoff:2, Tag:10, Character:8, CharacterAppearance:12, WikiPage:4, WikiAlias:3, WikiLink:3, Booklist:3, BooklistItem:8, BooklistItemRelation:3, BooklistStoryLink:2, BooklistProgress:2, ReadingPath:3, ReadingPathNode:8, ReadingTrail:2, ReadingProgress:3, ReadingSavepoint:3, ReadingHistory:5, Comment:5, Like:8, Rating:5, Follow:5, Activity:5, Notification:5, MergeRequest:2, Collaboration:2 };
  for (const [m, cnt] of Object.entries(finalCounts).sort()) {
    const beforeVal = before[m] ?? 0;
    const diff = cnt - beforeVal;
    const sign = diff > 0 ? '+' : '';
    console.log(`${m.padEnd(20)} ${String(beforeVal).padStart(3)} → ${String(cnt).padStart(3)} (${sign}${diff})`);
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
