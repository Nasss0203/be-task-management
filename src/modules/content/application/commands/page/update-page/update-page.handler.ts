import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PageResponseDto } from 'src/modules/content/application/dto/page/response/page.response.dto';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { UpdatePageCommand } from './update-page.command';
import type { PageActivityRecorder } from 'src/modules/content/application/ports/page-activity-recorder.port';

@Injectable()
export class UpdatePageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
    @Inject(CONTENT_TYPES.ports.PageActivityRecorder)
    private readonly activity: PageActivityRecorder,
  ) {}

  async execute(command: UpdatePageCommand): Promise<PageResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      let page = await this.pageRepo.findById(command.pageId, manager);

      if (!page) throw new NotFoundException('Page not found');
      await this.pageRepo.lockWorkspaceHierarchy(
        page.getWorkspaceId(),
        manager,
      );
      page = await this.pageRepo.findById(command.pageId, manager);

      if (!page) {
        throw new NotFoundException('Page not found');
      }

      page.update({
        title: command.dto.title,
        slug: command.dto.slug,
        icon: command.dto.icon,
        coverUrl: command.dto.cover_url,
      });

      const updatedPage = await this.pageRepo.save(page, manager);
      await this.activity.record(
        {
          actorId: command.actorId,
          pageId: command.pageId,
          action: 'PAGE_UPDATED',
        },
        manager,
      );

      return PageResponseDto.fromDomain(updatedPage);
    });
  }
}
