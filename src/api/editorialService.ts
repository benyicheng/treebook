import client from './client';
import type { EditorialChange, EditorialChangeAction, EditorialChangeDetail } from './types';
export type { EditorialChange, EditorialChangeAction, EditorialChangeDetail };

export const editorialService = {
  async listChanges(params: { status?: string; targetType?: string; targetId?: string; limit?: number; offset?: number }) {
    const res = await client.get('/editorial/changes', { params });
    return res.data as { items: EditorialChange[]; total: number };
  },

  async getChangeDetail(id: string) {
    const res = await client.get(`/editorial/changes/${id}`);
    return res.data as EditorialChangeDetail;
  },

  async applyChange(id: string) {
    const res = await client.post(`/editorial/changes/${id}/apply`);
    return res.data as EditorialChange;
  },

  async revertChange(id: string) {
    const res = await client.post(`/editorial/changes/${id}/revert`);
    return res.data as EditorialChange;
  },

  async createChange(payload: { targetType: string; targetId: string; field: string; proposed: string }) {
    const res = await client.post('/editorial/changes', payload);
    return res.data as EditorialChangeDetail;
  },
};
