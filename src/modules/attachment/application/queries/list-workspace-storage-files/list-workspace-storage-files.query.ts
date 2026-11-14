import type {
  StorageFileSort,
  StorageFileStatus,
  StorageFileType,
} from '../../ports/workspace-storage-reader.port';

export class ListWorkspaceStorageFilesQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly actorId: string,
    public readonly filters: {
      type?: StorageFileType;
      status?: StorageFileStatus;
      search?: string;
      sort?: StorageFileSort;
      page?: number;
      pageSize?: number;
    },
  ) {}
}
