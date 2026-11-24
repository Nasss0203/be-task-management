import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageVisitRepository } from 'src/modules/content/domain/repositories/page-visit.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import { RecordPageVisitCommand } from './record-page-visit.command';

@Injectable()
export class RecordPageVisitHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(CONTENT_TYPES.repositories.PageVisitRepository)
    private readonly pageVisitRepo: PageVisitRepository,

    private readonly authorizationService: AuthorizationService,
  ) {}

  async execute(command: RecordPageVisitCommand): Promise<void> {
    const page = await this.pageRepo.findById(command.pageId);

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    const canRead = await this.authorizationService.authorize({
      userId: command.userId,
      permissions: [PERMISSIONS.PAGE_READ],
      target: { type: 'page', id: page.getId() },
    });

    if (!canRead) {
      throw new ForbiddenException(
        'You do not have permission to view this page',
      );
    }

    await this.pageVisitRepo.record({
      userId: command.userId,
      pageId: page.getId(),
      workspaceId: page.getWorkspaceId(),
      visitedAt: new Date(),
    });
  }
}
