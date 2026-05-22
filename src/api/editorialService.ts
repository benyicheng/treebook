import client from './client';

export type EditorialChange = {
  id: string;
  targetType: string;
  targetId: string;
  field: string;
  status: string;
  original: string | null;
  proposed: string;
  appliedBy: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EditorialChangeAction = {
  id: string;
  changeId: string;
  action: string;
  actorUserId: string | null;
  payload: string | null;
  createdAt: string;
};

export type EditorialChangeDetail = EditorialChange & { actions: EditorialChangeAction[] };

export const editorialService = {
  async listChanges(params: { status?: string; targetType?: string; targetId?: string; limit?: number; offset?: number }) {
    const res = await client.get('/editorial/changes', { params });
    return res.data as EditorialChange[];
  },

  async getChangeById(id: string) {
    const res = await client.get(`/editorial/changes/${id}`);
    return res.data as EditorialChangeDetail;
  },

  async applyChange(id: string) {
    const res = await client.post(`/editorial/changes/${id}/apply`);
    return res.data as any;
  },
};

