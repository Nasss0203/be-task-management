import { Inject, Injectable } from '@nestjs/common';
import {
  buildPaginationMeta,
  normalizePagination,
  type PaginatedResult,
} from 'src/common/pagination/pagination.util';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { ATTACHMENT_TOKENS } from '../../../attachment.tokens';
import type {
  StorageFile,
  WorkspaceStorageReader,
} from '../../ports/workspace-storage-reader.port';
import { resolveStorageUploaderFilter } from '../../services/resolve-storage-uploader-filter';
import { ListWorkspaceStorageFilesQuery } from './list-workspace-storage-files.query';

export const STORAGE_FILES_PAGE_SIZE = 20;
export const STORAGE_FILES_MAX_PAGE_SIZE = 50;

@Injectable()
export class ListWorkspaceStorageFilesHandler {
  constructor(
    @Inject(ATTACHMENT_TOKENS.storageReader)
    private readonly storageReader: WorkspaceStorageReader,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: ListWorkspaceStorageFilesQuery,
  ): Promise<PaginatedResult<StorageFile>> {
    const { filters } = query;
    const pagination = normalizePagination(
      filters,
      STORAGE_FILES_PAGE_SIZE,
      STORAGE_FILES_MAX_PAGE_SIZE,
    );
    const uploadedBy = await resolveStorageUploaderFilter(
      this.authorizationService,
      query.workspaceId,
      query.actorId,
    );

    const { files, total } = await this.storageReader.listFiles({
      workspaceId: query.workspaceId,
      uploadedBy,
      type: filters.type,
      status: filters.status,
      search: filters.search?.trim() || undefined,
      sort: filters.sort ?? 'size_desc',
      skip: pagination.skip,
      take: pagination.take,
    });

    return {
      data: files,
      meta: buildPaginationMeta(pagination.page, pagination.pageSize, total),
    };
  }
}
