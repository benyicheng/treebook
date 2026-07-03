import client from './client';
import type { Permission, RoleItem, UserWithRoles } from './types';
export type { Permission, RoleItem, UserWithRoles };

export interface ListRolesParams {
  pageSize?: number;
  page?: number;
  q?: string;
}

export const roleService = {
  listRoles: async (params?: ListRolesParams) => {
    const { data } = await client.get<any>('/roles', { params });
    return data as { items: RoleItem[]; total: number; page: number; pageSize: number };
  },

  getRole: async (id: string) => {
    const { data } = await client.get<any>(`/roles/${id}`);
    return data;
  },

  createRole: async (payload: { name: string; description?: string; permissionIds?: string[] }) => {
    const { data } = await client.post<any>('/roles', payload);
    return data;
  },

  updateRole: async (id: string, payload: { name?: string; description?: string }) => {
    const { data } = await client.put<any>(`/roles/${id}`, payload);
    return data;
  },

  deleteRole: async (id: string) => {
    await client.delete(`/roles/${id}`);
  },

  updateRolePermissions: async (id: string, permissionIds: string[]) => {
    const { data } = await client.put<any>(`/roles/${id}/permissions`, { permissionIds });
    return data;
  },

  listPermissions: async () => {
    const { data } = await client.get<any>('/roles/permissions');
    return data;
  },

  listUsers: async (params?: { search?: string; page?: number; limit?: number }) => {
    const { data } = await client.get<any>('/users', { params });
    return data as { items: UserWithRoles[]; total: number; page: number; limit: number; totalPages: number };
  },

  assignRole: async (userId: string, roleId: string) => {
    const { data } = await client.post<any>(`/users/${userId}/roles`, { roleId });
    return data;
  },

  removeRole: async (userId: string, roleId: string) => {
    const { data } = await client.delete<any>(`/users/${userId}/roles/${roleId}`);
    return data;
  },
};
