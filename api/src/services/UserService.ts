import { prisma } from '../prisma';

// Prisma include fragment reused across auth operations
const USER_WITH_ROLES_INCLUDE = {
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  }
} as const;

type UserWithRoles = Awaited<ReturnType<typeof getUserWithPermissions>>;

/**
 * Fetch a user with their full RBAC roles + permissions.
 * Extracts a flat, deduplicated array of permission codes.
 */
export async function getUserWithPermissions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: USER_WITH_ROLES_INCLUDE,
  });

  if (!user) return null;

  const permissions = extractPermissions(user.roles);
  return { user, permissions };
}

/**
 * Flatten + deduplicate permission codes from a user's roles array.
 */
export function extractPermissions(
  roles: Array<{ role: { permissions: Array<{ permission: { code: string } }> } }>
): string[] {
  return Array.from(
    new Set(roles.flatMap(ur => ur.role.permissions.map(rp => rp.permission.code)))
  );
}

export { USER_WITH_ROLES_INCLUDE };
export type { UserWithRoles };
