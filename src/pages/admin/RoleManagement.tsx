import React, { useState } from 'react';
import { Shield, Plus, Edit3, Trash2, Check, X } from 'lucide-react';
import PermissionGate from '../../components/PermissionGate';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/useAuthStore';
import { useToast } from '../../components/Toast';
import roleService, { Permission, RoleItem } from '../../api/roleService';

const RoleManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuthStore();
  const { addToast } = useToast();

  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [q, setQ] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const canAssignPermissions = hasPermission('role:permission:assign');
  const canUpdateRole = hasPermission('role:update');

  const rolesQuery = useQuery({
    queryKey: ['adminRoles', page, pageSize, q],
    queryFn: () => roleService.listRoles({ page, pageSize, q: q.trim() || undefined }),
  });

  const permissionsQuery = useQuery({
    queryKey: ['adminPermissions'],
    queryFn: () => roleService.listPermissions(),
    staleTime: 60_000,
  });

  const roles = rolesQuery.data?.items || [];
  const total = rolesQuery.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const permissions: Permission[] = permissionsQuery.data || [];
  const isLoading = rolesQuery.isLoading || permissionsQuery.isLoading;
  const errorMessage = (rolesQuery.error as any)?.message || (permissionsQuery.error as any)?.message || null;

  const handleEdit = (role: RoleItem) => {
    const run = async () => {
      const full = await roleService.getRole(role.id);
      setEditingRole(full);
      setNewRoleName(full.name);
      setNewRoleDesc(full.description || '');
      setSelectedPermissions(full.permissions?.map((p) => p.permission.id) || []);
      setIsModalOpen(true);
    };
    run().catch(() => addToast('error', '加载角色详情失败'));
  };

  const handleCreate = () => {
    setEditingRole(null);
    setNewRoleName('');
    setNewRoleDesc('');
    setSelectedPermissions([]);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const permissionIds = Array.from(new Set(selectedPermissions));
      if (editingRole) {
        if (canUpdateRole) {
          await roleService.updateRole(editingRole.id, { name: newRoleName, description: newRoleDesc });
        }
        if (canAssignPermissions) {
          await roleService.updateRolePermissions(editingRole.id, permissionIds);
        }
      } else {
        await roleService.createRole({ name: newRoleName, description: newRoleDesc, permissionIds });
      }
      setIsModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
    } catch (error) {
      const msg = (error as any)?.response?.data?.error?.message || (error as any)?.response?.data?.message || (error as any)?.message || '操作失败';
      addToast('error', msg);
    }
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleRoleSelected = (id: string) => {
    setSelectedRoleIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearSelection = () => setSelectedRoleIds([]);

  const bulkDelete = async () => {
    if (selectedRoleIds.length === 0) return;
    if (!confirm(`确认删除 ${selectedRoleIds.length} 个角色？（已绑定用户的角色无法删除）`)) return;
    try {
      await roleService.bulkDeleteRoles(selectedRoleIds);
      clearSelection();
      await queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || error?.message || '批量删除失败';
      addToast('error', msg);
    }
  };

  const deleteRole = async (id: string) => {
    if (!confirm('确认删除该角色？（已绑定用户的角色无法删除）')) return;
    try {
      await roleService.deleteRole(id);
      await queryClient.invalidateQueries({ queryKey: ['adminRoles'] });
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || error?.message || '删除失败';
      addToast('error', msg);
    }
  };

  const exportRoles = async () => {
    try {
      const blob = await roleService.exportRolesCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'roles.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      const msg = error?.response?.data?.error?.message || error?.message || '导出失败';
      addToast('error', msg);
    }
  };

  if (isLoading) return <div className="p-10">加载中...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-ink-800 dark:text-white flex items-center gap-3">
            <Shield className="text-accent-500" size={32} />
            角色与权限管理
          </h1>
          <p className="text-ink-500 mt-2">管理系统角色及其对应的功能权限</p>
        </div>
        <PermissionGate permission="role:create">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-6 py-3 bg-accent-500 text-white rounded-xl font-bold hover:bg-accent-600 transition-all shadow-lg shadow-accent-400/20"
          >
            <Plus size={20} />
            新建角色
          </button>
        </PermissionGate>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-6">
        <div className="flex gap-3 items-center">
          <input
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            className="px-4 py-3 rounded-2xl bg-ink-50 dark:bg-ink-700 border border-transparent focus:border-accent-400 focus:ring-2 focus:ring-accent-400/20 outline-none font-bold text-ink-800 dark:text-white w-full md:w-80"
            placeholder="搜索角色名称或描述..."
          />
          <button
            onClick={() => rolesQuery.refetch()}
            className="px-4 py-3 rounded-2xl bg-ink-100 dark:bg-ink-700 text-ink-800 dark:text-white font-black hover:bg-ink-200 dark:hover:bg-ink-600 transition-all active:scale-95"
          >
            刷新
          </button>
        </div>
        <div className="flex flex-wrap gap-3 justify-end">
          <PermissionGate permission="role:read">
            <button
              onClick={exportRoles}
              className="px-4 py-3 rounded-2xl bg-ink-100 dark:bg-ink-700 text-ink-800 dark:text-white font-black hover:bg-ink-200 dark:hover:bg-ink-600 transition-all active:scale-95"
            >
              导出 CSV
            </button>
          </PermissionGate>
          <PermissionGate permission="role:delete">
            <button
              disabled={selectedRoleIds.length === 0}
              onClick={bulkDelete}
              className="px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 font-black hover:bg-red-100 dark:hover:bg-red-900/30 transition-all active:scale-95 disabled:opacity-50"
            >
              批量删除
            </button>
          </PermissionGate>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 font-bold text-sm">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <div key={role.id} className="bg-white dark:bg-ink-700 rounded-3xl p-6 border border-ink-100 dark:border-ink-600 hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-ink-800 dark:text-white">{role.name}</h3>
                <p className="text-sm text-ink-500 mt-1">{role.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(role.id)}
                  onChange={() => toggleRoleSelected(role.id)}
                  className="w-4 h-4"
                  aria-label={`选择角色 ${role.name}`}
                />
                {(canUpdateRole || canAssignPermissions) && (
                  <button
                    onClick={() => handleEdit(role)}
                    className="p-2 text-ink-400 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 rounded-lg transition-colors"
                    aria-label={`编辑角色 ${role.name}`}
                  >
                    <Edit3 size={18} />
                  </button>
                )}
                {hasPermission('role:delete') && (
                  <button
                    onClick={() => deleteRole(role.id)}
                    className="p-2 text-ink-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    aria-label={`删除角色 ${role.name}`}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-ink-500 bg-ink-50 dark:bg-ink-800/50 p-3 rounded-xl">
                <Shield size={16} />
                <span>包含 {role._count?.permissions ?? role.permissions?.length ?? 0} 项权限</span>
              </div>

              <div className="text-xs text-ink-400 font-bold uppercase tracking-wider">
                已绑定用户：{role._count?.users ?? 0}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="text-sm text-ink-500 font-bold">
          共 {total} 条 · 第 {page}/{totalPages} 页
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl bg-ink-100 dark:bg-ink-700 text-ink-800 dark:text-white font-black disabled:opacity-50"
          >
            上一页
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl bg-ink-100 dark:bg-ink-700 text-ink-800 dark:text-white font-black disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-ink-50 dark:bg-ink-800 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-ink-100 dark:border-ink-700 flex justify-between items-center">
              <h3 className="text-xl font-black text-ink-800 dark:text-white">
                {editingRole ? '编辑角色权限' : '新建角色'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-ink-400 hover:text-ink-500">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink-500 uppercase">角色名称</label>
                  <input
                    className="w-full px-4 py-3 bg-ink-50 dark:bg-ink-700 border-none rounded-xl focus:ring-2 focus:ring-accent-400 outline-none"
                    placeholder="例如: editor"
                    value={newRoleName}
                    onChange={e => setNewRoleName(e.target.value)}
                    disabled={editingRole ? !canUpdateRole : false}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-ink-500 uppercase">描述</label>
                  <input
                    className="w-full px-4 py-3 bg-ink-50 dark:bg-ink-700 border-none rounded-xl focus:ring-2 focus:ring-accent-400 outline-none"
                    placeholder="角色职能描述"
                    value={newRoleDesc}
                    onChange={e => setNewRoleDesc(e.target.value)}
                    disabled={editingRole ? !canUpdateRole : false}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-ink-500 uppercase">权限配置</label>
                  <span className="text-xs text-accent-500 font-bold">{selectedPermissions.length} 已选择</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {permissions.map(perm => (
                    <div
                      key={perm.id}
                      onClick={() => (canAssignPermissions ? togglePermission(perm.id) : undefined)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedPermissions.includes(perm.id)
                          ? 'border-accent-400 bg-accent-50 dark:bg-accent-500/10'
                          : 'border-transparent bg-ink-50 dark:bg-ink-700 hover:bg-ink-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                          selectedPermissions.includes(perm.id) ? 'bg-accent-400 border-accent-400 text-white' : 'border-ink-300'
                        }`}>
                          {selectedPermissions.includes(perm.id) && <Check size={12} strokeWidth={4} />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-ink-800 dark:text-white">{perm.code}</div>
                          <div className="text-xs text-ink-500">{perm.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-ink-100 dark:border-ink-700 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-300 rounded-xl font-bold hover:bg-ink-200"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-accent-500 text-white rounded-xl font-bold hover:bg-accent-600 shadow-lg shadow-accent-400/20"
              >
                保存配置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
