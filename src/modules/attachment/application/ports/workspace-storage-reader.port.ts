export const STORAGE_FILE_TYPES = ['image', 'document', 'other'] as const;
export const STORAGE_FILE_STATUSES = [
  'IN_USE',
  'IN_TRASH',
  'ORPHANED',
] as const;
export const STORAGE_FILE_SORTS = [
  'size_desc',
  'created_desc',
  'created_asc',
] as const;

export type StorageFileType = (typeof STORAGE_FILE_TYPES)[number];
export type StorageFileStatus = (typeof STORAGE_FILE_STATUSES)[number];
export type StorageFileSort = (typeof STORAGE_FILE_SORTS)[number];

export type StorageUsage = {
  bytes: number;
  count: number;
};

export type WorkspaceStorageUsage = {
  workspace: StorageUsage;
  byType: Record<StorageFileType, StorageUsage>;
  mine: StorageUsage;
};

export type StorageFile = {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  type: StorageFileType;
  status: StorageFileStatus;
  createdAt: Date;
  uploadedBy: {
    id: string;
    username: string;
    avatarUrl: string | null;
  } | null;
  location: { pageId: string; pageTitle: string } | null;
};

export type ListStorageFilesInput = {
  workspaceId: string;
  uploadedBy: string | null;
  type?: StorageFileType;
  status?: StorageFileStatus;
  search?: string;
  sort: StorageFileSort;
  skip: number;
  take: number;
};

export interface WorkspaceStorageReader {
  getUsage(
    workspaceId: string,
    actorId: string,
  ): Promise<WorkspaceStorageUsage>;

  listFiles(
    input: ListStorageFilesInput,
  ): Promise<{ files: StorageFile[]; total: number }>;
}
