import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.characterAppearance.deleteMany();
  await prisma.character.deleteMany();
  await prisma.readingPathNode.deleteMany();
  await prisma.readingPath.deleteMany();
  await prisma.booklistItem.deleteMany();
  await prisma.booklist.deleteMany();
  await prisma.collaboration.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.spinoff.deleteMany();
  await prisma.story.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const authorPass = await bcrypt.hash('password123', 10);
  const author = await prisma.user.create({
    data: {
      email: 'author@example.com',
      username: '艾萨克',
      passwordHash: authorPass,
      role: 'author',
    },
  });

  const readerPass = await bcrypt.hash('password123', 10);
  const reader = await prisma.user.create({
    data: {
      email: 'reader@example.com',
      username: '星空游民',
      passwordHash: readerPass,
      role: 'reader',
    },
  });

  // Create admin user
  const adminPass = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      username: '管理员',
      passwordHash: adminPass,
      role: 'admin',
    },
  });

  // Create stories
  const story1 = await prisma.story.create({
    data: {
      title: '星际余晖',
      description: '在银河系边缘的废弃空间站，人类最后的幸存者发现了一个改变命运的秘密。',
      coverImage: 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=scifi+space+station+nebula+epic+book+cover&image_size=square_hd',
      authorId: author.id,
      status: 'ongoing',
    },
  });

  // Create chapters for story1
  const chapter1 = await prisma.chapter.create({
    data: {
      storyId: story1.id,
      title: '第一章：遗忘的哨所',
      content: '<p>空间站的走廊里弥漫着陈旧的臭氧味...</p>',
      orderIndex: 1,
      isBranchPoint: true,
    },
  });

  const chapter2 = await prisma.chapter.create({
    data: {
      storyId: story1.id,
      title: '第二章：古老的信号',
      content: '<p>终端机屏幕上跳动着不属于人类文明的字符...</p>',
      orderIndex: 2,
    },
  });

  // Create a branch from chapter1
  const branch1 = await prisma.branch.create({
    data: {
      parentStoryId: story1.id,
      parentChapterId: chapter1.id,
      authorId: reader.id,
      title: '暗影协议',
      description: '假如主角在空间站没有选择开启秘密，而是选择了逃离...',
      branchType: 'alternate',
      isOfficial: false,
    },
  });

  // Create chapters for branch1
  await prisma.chapter.create({
    data: {
      storyId: story1.id,
      branchId: branch1.id,
      title: '分支二：紧急撤离',
      content: '<p>警报声响起，主角冲向了逃生舱...</p>',
      orderIndex: 2,
    },
  });

  // Create a booklist
  await prisma.booklist.create({
    data: {
      title: '硬核科幻必读路线',
      description: '从遗忘哨所到最终真相的深度探索。',
      creatorId: author.id,
      items: {
        create: [
          { chapterId: chapter1.id, orderIndex: 1, notes: '入门必读' },
          { chapterId: chapter2.id, orderIndex: 2, notes: '核心剧情' },
        ]
      }
    }
  });

  // Create story: 西游记
  const story2 = await prisma.story.create({
    data: {
      title: '西游记',
      description: '师徒四人西天取经的故事',
      authorId: reader.id,
      status: 'ongoing',
      tags: {
        connectOrCreate: [
          { where: { name: '神话' }, create: { name: '神话' } },
          { where: { name: '冒险' }, create: { name: '冒险' } },
        ]
      }
    },
  });

  // Create chapters for 西游记
  await prisma.chapter.create({
    data: {
      storyId: story2.id,
      title: '第一回：灵根育孕源流出 心性修持大道生',
      content: '<p>东胜神洲傲来国海中有花果山，山项上一仙石孕育出一石猴...</p>',
      orderIndex: 1,
      isBranchPoint: true,
    },
  });

  // ── Characters for 星际余晖 ──
  const charCaptain = await prisma.character.create({
    data: {
      storyId: story1.id,
      name: '艾伦·卡特',
      description: '银河联盟第7探索舰前舰长，冷静果断，背负着失落文明的秘密。',
      role: 'protagonist',
    },
  });

  const charAI = await prisma.character.create({
    data: {
      storyId: story1.id,
      name: 'NEXUS-9',
      description: '空间站中枢人工智能，其真实意图无人知晓。',
      role: 'antagonist',
    },
  });

  const charCommander = await prisma.character.create({
    data: {
      storyId: story1.id,
      name: '李薇',
      description: '空间站驻留指挥官，技术专家，卡特的老战友。',
      role: 'supporting',
    },
  });

  // ── Reading Path for 星际余晖 ──
  const readingPath = await prisma.readingPath.create({
    data: {
      storyId: story1.id,
      creatorId: author.id,
      title: '星际余晖 · 主线探索',
      description: '从发现信号到揭开真相的完整主线旅程',
      origin: 'author',
      nodes: {
        create: [
          { sortOrder: 0, nodeCategory: 'chapter', contentId: chapter1.id, note: '故事从这里开始' },
          { sortOrder: 1, nodeCategory: 'chapter', contentId: chapter2.id, note: '神秘信号之谜' },
        ],
      },
    },
    include: { nodes: true },
  });

  // ── Character Appearances ──
  // 艾伦出现在第一章
  await prisma.characterAppearance.create({
    data: {
      characterId: charCaptain.id,
      targetType: 'chapter',
      targetId: chapter1.id,
      appearanceType: 'main_focus',
    },
  });
  // 艾伦也出现在第二章
  await prisma.characterAppearance.create({
    data: {
      characterId: charCaptain.id,
      targetType: 'chapter',
      targetId: chapter2.id,
      appearanceType: 'main_focus',
    },
  });
  // NEXUS-9 出现在第一章（伏笔）
  await prisma.characterAppearance.create({
    data: {
      characterId: charAI.id,
      targetType: 'chapter',
      targetId: chapter1.id,
      appearanceType: 'mention',
    },
  });
  // NEXUS-9 在第二章正面出场
  await prisma.characterAppearance.create({
    data: {
      characterId: charAI.id,
      targetType: 'chapter',
      targetId: chapter2.id,
      appearanceType: 'appears',
    },
  });
  // 李薇出现在第一章
  await prisma.characterAppearance.create({
    data: {
      characterId: charCommander.id,
      targetType: 'chapter',
      targetId: chapter1.id,
      appearanceType: 'appears',
    },
  });

  // Create story: 凡人修仙传
  const story3 = await prisma.story.create({
    data: {
      title: '凡人修仙传',
      description: '一个普通山村小子，偶然之下，跨入到一个江湖小门派，成了一名记名弟子。他以这样身份，如何在门派中立足，如何以平庸的资质进入到修仙者的行列？',
      authorId: author.id,
      status: 'ongoing',
      tags: {
        connectOrCreate: [
          { where: { name: '修仙' }, create: { name: '修仙' } },
          { where: { name: '玄幻' }, create: { name: '玄幻' } },
        ]
      }
    },
  });

  // Create chapters for 凡人修仙传
  await prisma.chapter.create({
    data: {
      storyId: story3.id,
      title: '第一章：山边小村',
      content: '<p>二愣子睁大着双眼，直直望着茅草和烂泥糊成的黑屋顶...</p>',
      orderIndex: 1,
      isBranchPoint: true,
    },
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
