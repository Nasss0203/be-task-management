import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import type {
  AdminPublishedSiteModerationResult,
  AdminPublishedSiteWriter,
} from '../../ports/admin-published-site-writer.port';
import { RestoreAdminPublishedSiteCommand } from './restore-admin-published-site.command';

@Injectable()
export class RestoreAdminPublishedSiteHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.PublishedSiteWriter)
    private readonly writer: AdminPublishedSiteWriter,
  ) {}

  async execute(
    command: RestoreAdminPublishedSiteCommand,
  ): Promise<AdminPublishedSiteModerationResult> {
    const outcome = await this.writer.restoreSite({
      siteId: command.siteId,
      actor: { userId: command.actorUserId, ...command.client },
    });

    if (outcome.kind === 'NOT_FOUND') {
      throw new NotFoundException('Published site not found');
    }

    if (outcome.kind === 'UNCHANGED') {
      throw new ConflictException(
        'Published site is not disabled by an administrator',
      );
    }

    return outcome.site;
  }
}
