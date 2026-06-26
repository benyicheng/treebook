import client from './client';

export interface Permission {
  id: string;
  code: string;
  description: string;
}

export interface RoleItem {
  id: string;
  name: string;
  description?: string;
  permissions?: { permission: Permission }[];
  _count: { users: number; permissions?: number };
}

export interface UserWithRoles {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  profile: string | null;
  followerCount: number;
  followingCount: number;
  createdAt: string;
  roles: { roleId: string; role: { id: string; name: string } }[];
}

export interface PaginatedUsers {
  items: UserWithRoles[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const roleService = {
  /** 获取角色列表（分页 + 搜索） */
  async listRoles(params?: { page?: number; pageSize?: number; q?: string }) {
    const res = await client.get('/roles', { params });
    return res.data as { items: RoleItem[]; total: number; page: number; pageSize: number; totalPages: number };
  },

  /** 获取单个角色详情（含权限） */
  async getRole(id: string) {
    const res = await client.get(`/roles/${id}`);
    return res.data as RoleItem;
  },

  /** 创建角色 */
  async createRole(data: { name: string; description?: string; permissionIds: string[] }) {
    const res = await client.post('/roles', data);
    return res.data;
  },

  /** 更新角色基本信息 */
  async updateRole(id: string, data: { name?: string; description?: string }) {
    const res = await client.patch(`/roles/${id}`, data);
    return res.data;
  },

  /** 更新角色权限 */
  async updateRolePermissions(id: string, permissionIds: string[]) {
    const res = await client.post(`/roles/${id}/permissions`, { permissionIds });
    return res.data;
  },

  /** 删除角色 */
  async deleteRole(id: string) {
    const res = await client.delete(`/roles/${id}`);
    return res.data;
  },

  /** 批量删除角色 */
  async bulkDeleteRoles(ids: string[]) {
    const res = await client.post('/roles/bulk-delete', { ids });
    return res.data;
  },

  /** 获取所有权限列表 */
  async listPermissions(search?: string) {
    const res = await client.get('/roles/permissions', { params: { search } });
    return res.data as Permission[];
  },

  /** 导出角色为 CSV */
  async exportRolesCsv() {
    const res = await client.get('/roles/export', { params: { format: 'csv' }, responseType: 'blob' as const });
    return res.data as Blob;
  },

  /** 获取用户列表（含角色信息，分页 + 搜索） */
  async listUsers(params?: { page?: number; limit?: number; search?: string; sortBy?: string }) {
    const res = await client.get('/users', { params });
    return res.data as PaginatedUsers;
  },

  /** 为用户分配角色 */
  async assignRole(userId: string, roleId: string) {
    const res = await client.post(`/users/${userId}/roles`, { roleId });
    return res.data;
  },

  /** 移除用户角色 */
  async removeRole(userId: string, roleId: string) {
    const res = await client.delete(`/users/${userId}/roles/${roleId}`);
    return res.data;
  },
};

export default roleService;
