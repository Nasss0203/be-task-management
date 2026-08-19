import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { UpdatePageDto } from 'src/modules/content/application/dto/page/update-page.dto';
import { PageResponseDto } from 'src/modules/content/application/dto/page/response/page.response.dto';
import type { UnitOfWork } from 'src/interface/index.interface';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

export class UpdatePageCommand {
  constructor(public readonly pageId: string, public readonly dto: UpdatePageDto) {}
}

@Injectable()
export class UpdatePageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: UpdatePageCommand): Promise<PageResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      const page = await this.pageRepo.findById(command.pageId, { manager });
      if (!page) {
        throw new NotFoundException('Page not found');
      }

      page.update({
        title: command.dto.title,
        slug: command.dto.slug,
        icon: command.dto.icon,
        coverUrl: command.dto.cover_url,
      });

      const updatedPage = await this.pageRepo.save(page, { manager });
      return PageResponseDto.fromDomain(updatedPage);
    });
  }
}
