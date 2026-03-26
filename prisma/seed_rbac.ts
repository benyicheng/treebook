import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  AUTHOR: 'author',
  READER: 'reader'
};

const PERMISSIONS = [
  // User Management
  { code: 'user:create', description: 'Create users' },
  { code: 'user:read', description: 'View users' },
  { code: 'user:update', description: 'Update users' },
  { code: 'user:delete', description: 'Delete users' },
  { code: 'user:role:assign', description: 'Assign roles to users' },

  // Role Management
  { code: 'role:create', description: 'Create roles' },
  { code: 'role:read', description: 'View roles' },
  { code: 'role:update', description: 'Update roles' },
  { code: 'role:delete', description: 'Delete roles' },
  { code: 'role:permission:assign', description: 'Assign permissions to roles' },

  // Content Management (Story)
  { code: 'story:create', description: 'Create stories' },
  { code: 'story:read', description: 'View stories' },
  { code: 'story:update', description: 'Update stories' },
  { code: 'story:delete', description: 'Delete stories' },
  { code: 'story:audit', description: 'Audit stories' },

  // System
  { code: 'system:settings', description: 'Manage system settings' },
  { code: 'system:logs', description: 'View system logs' },
];

const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: PERMISSIONS.map(p => p.code), // Admin gets everything
  [ROLES.EDITOR]: [
    'story:create', 'story:read', 'story:update', 'story:delete',
    'user:read',
    'tag:create', 'tag:update', 'tag:delete' // Assuming tags exist or will exist
  ],
  [ROLES.AUTHOR]: [
    'story:create', 'story:read', 'story:update', 'story:delete' // Own stories logic handled in code, but role has capability
  ],
  [ROLES.READER]: [
    'story:read'
  ]
};

async function main() {
  console.log('Seeding RBAC data...');

  // 1. Create Permissions
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }
  console.log('Permissions seeded.');

  // 2. Create Roles
  for (const roleName of Object.values(ROLES)) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: {
        name: roleName,
        description: `Default ${roleName} role`,
      },
    });
  }
  console.log('Roles seeded.');

  // 3. Assign Permissions to Roles
  for (const [roleName, permCodes] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;

    // Get permission IDs
    const permissions = await prisma.permission.findMany({
      where: { code: { in: permCodes } }
    });

    // Create RolePermission entries
    for (const perm of permissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: perm.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: perm.id
        }
      });
    }
  }
  console.log('Role permissions assigned.');

  // 4. Migrate existing users to have roles based on their 'role' string field
  const users = await prisma.user.findMany();
  for (const user of users) {
    let roleName = user.role || 'reader';
    // Map old roles to new roles if necessary, currently they match
    if (roleName === 'admin') roleName = ROLES.ADMIN;
    
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (role) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: role.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleId: role.id
        }
      });
    }
  }
  console.log('Existing users migrated to RBAC.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
