export type EditorialTargetType = 'story' | 'chapter' | 'spinoff' | 'booklist';

export type EditorialField =
  | 'title'
  | 'description'
  | 'content'
  | 'coverImage'
  | 'notes';

export type EditorialChangeStatus = 'draft' | 'submitted' | 'applied' | 'rejected';

export type EditorialChangeRow = {
  id: string;
  targetType: EditorialTargetType;
  targetId: string;
  field: EditorialField;
  status: EditorialChangeStatus;
  original: string | null;
  proposed: string;
  appliedBy: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EditorialChangeActionRow = {
  id: string;
  changeId: string;
  action: string;
  actorUserId: string | null;
  payload: string | null;
  createdAt: string;
};

export type EditorialChangeDetail = EditorialChangeRow & { actions: EditorialChangeActionRow[] };
