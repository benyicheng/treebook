export type MediaKind = 'image' | 'audio' | 'video';

export type MediaAssetStatus =
  | 'quarantined'
  | 'approved'
  | 'rejected'
  | 'failed_scan';

export type MediaAssetRow = {
  id: string;
  ownerUserId: string | null;
  purpose: string | null;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  storageProvider: string;
  storagePath: string;
  status: MediaAssetStatus;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  createdAt: string;
  updatedAt: string;
};
