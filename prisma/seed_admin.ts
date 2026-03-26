import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@example.com';
  const username = '系统管理员';
  const password = 'Admin123!';

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { username, passwordHash, role: 'admin' },
    });
    console.log(`Admin user updated: ${email}`);
    return;
  }

  await prisma.user.create({
    data: { email, username, passwordHash, role: 'admin' },
  });
  console.log(`Admin user created: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

