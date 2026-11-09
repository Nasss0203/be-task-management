import { Inject, Injectable } from '@nestjs/common';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { ATTACHMENT_TOKENS } from '../../../attachment.tokens';
import type {
  WorkspaceStorageReader,
  WorkspaceStorageUsage,
} from '../../ports/workspace-storage-reader.port';
import { resolveStorageUploaderFilter } from '../../services/resolve-storage-uploader-filter';
import { GetWorkspaceStorageQuery } from './get-workspace-storage.query';

@Injectable()
export class GetWorkspaceStorageHandler {
  constructor(
    @Inject(ATTACHMENT_TOKENS.storageReader)
    private readonly storageReader: WorkspaceStorageReader,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(
    query: GetWorkspaceStorageQuery,
  ): Promise<WorkspaceStorageUsage & { canManageAll: boolean }> {
    const [usage, uploaderFilter] = await Promise.all([
      this.storageReader.getUsage(query.workspaceId, query.actorId),
      resolveStorageUploaderFilter(
        this.authorizationService,
        query.workspaceId,
        query.actorId,
      ),
    ]);

    return { ...usage, canManageAll: uploaderFilter === null };
  }
}
