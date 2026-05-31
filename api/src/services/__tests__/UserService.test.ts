import { describe, it, expect } from 'vitest';
import { extractPermissions } from '../../services/UserService';

describe('extractPermissions', () => {
  it('returns empty array for empty roles', () => {
    expect(extractPermissions([])).toEqual([]);
  });

  it('flattens permissions from a single role', () => {
    const roles = [
      {
        role: {
          permissions: [
            { permission: { code: 'story:read' } },
            { permission: { code: 'story:write' } },
          ],
        },
      },
    ];
    const perms = extractPermissions(roles);
    expect(perms).toContain('story:read');
    expect(perms).toContain('story:write');
    expect(perms).toHaveLength(2);
  });

  it('deduplicates permissions across multiple roles', () => {
    const roles = [
      { role: { permissions: [{ permission: { code: 'story:read' } }] } },
      { role: { permissions: [{ permission: { code: 'story:read' } }, { permission: { code: 'cms:manage' } }] } },
    ];
    const perms = extractPermissions(roles);
    expect(perms.filter((p: string) => p === 'story:read')).toHaveLength(1);
    expect(perms).toContain('cms:manage');
    expect(perms).toHaveLength(2);
  });
});
