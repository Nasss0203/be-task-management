import { Inject, Injectable } from '@nestjs/common';
import type { UnitOfWork } from 'src/interface/index.interface';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import { PageBlock, PageBlockType } from 'src/modules/content/domain/entities/page-block.entity';
import { CreatePageDto } from 'src/modules/content/application/dto/page/create-page.dto';
import { PageResponseDto } from 'src/modules/content/application/dto/page/response/page.response.dto';

export class CreatePageCommand {
  constructor(public readonly dto: CreatePageDto) {}
}

@Injectable()
export class CreatePageHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageRepository)
    private readonly pageRepo: PageRepository,
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: CreatePageCommand): Promise<PageResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      const page = Page.create({
        workspaceId: command.dto.workspace_id,
        title: command.dto.title,
        createdBy: command.dto.created_by,
        slug: command.dto.slug,
        icon: command.dto.icon,
        coverUrl: command.dto.cover_url,
        isTemplate: command.dto.is_template,
      });

      const savedPage = await this.pageRepo.save(page, { manager });

      // If it's a default workspace creation or something, wait - createDefault was a separate method.
      // But looking at the original PageController:
      // it calls `createPageApplication.create({...createPageDto})` which only called `createPageService.create`.
      // So no default block is created from HTTP POST /page!
      // The default block was created via `createDefault` which is called by `create-workspace.handler.ts`

      return PageResponseDto.fromDomain(savedPage); // Assume this method exists or we use the old PageResponseDto
    });
  }

  async executeDefault(dto: CreatePageDto, externalManager?: any): Promise<any> {
    const doWork = async (manager: any) => {
      const page = Page.create({
        workspaceId: dto.workspace_id,
        title: dto.title,
        createdBy: dto.created_by,
        slug: dto.slug,
        icon: dto.icon,
        coverUrl: dto.cover_url,
        isTemplate: dto.is_template,
      });

      const savedPage = await this.pageRepo.save(page, { manager });

      const block = PageBlock.create({
        pageId: savedPage.getId(),
        type: PageBlockType.DATABASE_VIEW,
        title: savedPage.getTitle(),
        positionX: 0,
        positionY: 0,
        width: 12,
        height: 1,
        orderIndex: 0,
        createdBy: savedPage.getCreatedBy(),
        isOpen: true,
      });

      const savedBlock = await this.pageBlockRepo.save(block, { manager });

      return {
        page: PageResponseDto.fromDomain(savedPage),
        pageBlock: savedBlock,
      };
    };

    return externalManager ? doWork(externalManager) : this.uow.runInTransaction(doWork);
  }
}
