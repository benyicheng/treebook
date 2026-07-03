import React, { useState } from 'react';
import { Users, Plus, X, Search, Shield } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../components/notifications';
import { Button, IconButton, Input, Badge } from '../../components/ui';
import { roleService, UserWithRoles } from '../../api/roleService';

const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [assigningUser, setAssigningUser] = useState<UserWithRoles | null>(null);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => roleService.listUsers({ page, limit: 20, search: search || undefined }),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['admin', 'roles', 'all'],
    queryFn: () => roleService.listRoles({ pageSize: 100 }),
  });

  const allRoles = rolesData?.items || [];

  const handleAssignRole = async (roleId: string) => {
    if (!assigningUser) return;
    try {
      await roleService.assignRole(assigningUser.id, roleId);
      addToast('success', '角色分配成功');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setAssigningUser(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || '分配失败';
      addToast('error', msg);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    try {
      await roleService.removeRole(userId, roleId);
      addToast('success', '角色已移除');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    } catch (err: any) {
      const msg = err?.response?.data?.message || '移除失败';
      addToast('error', msg);
    }
  };

  const assignedRoleIds = (user: UserWithRoles) =>
    new Set(user.roles?.map((r) => r.roleId) || []);

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
            <Users size={22} className="text-accent-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-ink-800 dark:text-white">用户管理</h1>
            <p className="text-sm text-ink-500 dark:text-ink-400 mt-0.5">管理用户角色分配</p>
          </div>
        </div>
        <Input
          type="text"
          placeholder="搜索用户名或邮箱..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          leftIcon={<Search size={16} />}
          wrapperClassName="w-64"
        />
      </div>

      {/* 用户列表 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent-400 border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-ink-800 rounded-2xl border border-ink-100 dark:border-ink-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-100 dark:border-ink-700 bg-ink-50/50 dark:bg-ink-700/50">
                    <th className="text-left px-6 py-4 text-xs font-bold text-ink-400 uppercase tracking-wider">用户</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-ink-400 uppercase tracking-wider">邮箱</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-ink-400 uppercase tracking-wider">旧角色</th>
                    <th className="text-left px-6 py-4 text-xs font-bold text-ink-400 uppercase tracking-wider">RBAC 角色</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-ink-400 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50 dark:divide-ink-700">
                  {(usersData?.items || []).map((user) => {
                    const userRoleIds = assignedRoleIds(user);
                    const unassignedRoles = allRoles.filter((r) => !userRoleIds.has(r.id));
                    return (
                      <tr key={user.id} className="hover:bg-ink-50/50 dark:hover:bg-ink-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-400 to-accent-600 flex items-center justify-center text-white font-bold text-xs">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              ) : (
                                user.username?.[0]?.toUpperCase() || '?'
                              )}
                            </div>
                            <span className="text-sm font-bold text-ink-800 dark:text-white">{user.username}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-ink-500 dark:text-ink-400">{user.email}</td>
                        <td className="px-6 py-4">
                          <Badge
                            tone={
                              user.role === 'admin' ? 'danger' :
                              user.role === 'author' ? 'accent' :
                              'neutral'
                            }
                            variant="soft"
                            size="sm"
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(user.roles || []).map((ur) => (
                              <span key={ur.roleId} className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 rounded-md text-xs font-bold group">
                                <Shield size={10} />
                                {ur.role.name}
                                <button
                                  onClick={() => handleRemoveRole(user.id, ur.roleId)}
                                  className="ml-0.5 p-0.5 rounded hover:bg-violet-200 dark:hover:bg-violet-800/50 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="移除此角色"
                                >
                                  <X size={10} />
                                </button>
                              </span>
                            ))}
                            {(!user.roles || user.roles.length === 0) && (
                              <span className="text-xs text-ink-400 italic">无 RBAC 角色</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {unassignedRoles.length > 0 && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setAssigningUser(user)}
                              leftIcon={<Plus size={14} />}
                            >
                              分配角色
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {(usersData?.items?.length || 0) === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-ink-400">
                <Users size={40} className="mb-3 opacity-30" />
                <p className="text-sm font-medium">暂无用户数据</p>
              </div>
            )}
          </div>

          {/* 分页 */}
          {usersData && usersData.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-ink-500">
                共 {usersData.total} 名用户，第 {usersData.page}/{usersData.totalPages} 页
              </p>
              <div className="flex gap-2">
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  上一页
                </Button>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(usersData.totalPages, p + 1))}
                  disabled={page >= usersData.totalPages}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 分配角色弹窗 */}
      {assigningUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center scrim backdrop-blur-sm" onClick={() => setAssigningUser(null)}>
          <div className="bg-white dark:bg-ink-800 rounded-2xl shadow-2xl border border-ink-100 dark:border-ink-700 w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-ink-800 dark:text-white">为 {assigningUser.username} 分配角色</h3>
              <IconButton aria-label="关闭" onClick={() => setAssigningUser(null)} variant="ghost" size="sm" className="text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-700">
                <X size={18} />
              </IconButton>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allRoles
                .filter((r) => !assignedRoleIds(assigningUser).has(r.id))
                .map((role) => (
                  <button
                    key={role.id}
                    onClick={() => handleAssignRole(role.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                      <Shield size={14} className="text-accent-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ink-800 dark:text-white group-hover:text-accent-600 dark:group-hover:text-violet-400">{role.name}</p>
                      <p className="text-xs text-ink-500">{role.description || '无描述'} · {role._count?.users || 0} 用户</p>
                    </div>
                    <Plus size={16} className="ml-auto text-ink-300 group-hover:text-accent-400" />
                  </button>
                ))}
              {allRoles.filter((r) => !assignedRoleIds(assigningUser).has(r.id)).length === 0 && (
                <p className="text-sm text-ink-400 text-center py-4">该用户已拥有所有角色</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
