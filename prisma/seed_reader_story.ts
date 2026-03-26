import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'reader@example.com' },
  });

  if (!user) {
    console.error('User reader@example.com not found');
    return;
  }

  const story = await prisma.story.create({
    data: {
      title: '西游记',
      description: '师徒四人西天取经的故事',
      authorId: user.id,
      tags: {
        connectOrCreate: [
          { where: { name: '神话' }, create: { name: '神话' } },
          { where: { name: '冒险' }, create: { name: '冒险' } },
        ]
      }
    },
  });

  console.log('Created story:', story);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
