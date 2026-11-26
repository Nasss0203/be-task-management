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
import { DisableAdminPublishedSiteCommand } from './disable-admin-published-site.command';

@Injectable()
export class DisableAdminPublishedSiteHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.PublishedSiteWriter)
    private readonly writer: AdminPublishedSiteWriter,
  ) {}

  async execute(
    command: DisableAdminPublishedSiteCommand,
  ): Promise<AdminPublishedSiteModerationResult> {
    const outcome = await this.writer.disableSite({
      siteId: command.siteId,
      reason: command.reason,
      actor: { userId: command.actorUserId, ...command.client },
    });

    if (outcome.kind === 'NOT_FOUND') {
      throw new NotFoundException('Published site not found');
    }

    if (outcome.kind === 'UNCHANGED') {
      throw new ConflictException(
        'Published site is already disabled by an administrator',
      );
    }

    return outcome.site;
  }
}
