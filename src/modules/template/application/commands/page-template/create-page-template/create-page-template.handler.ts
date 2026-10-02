import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  ContentPageBlockSnapshot,
  ContentPageSnapshotReaderPort,
} from 'src/modules/content/application/ports/content-page-snapshot-reader.port';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { PageTemplate } from '../../../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import { PageTemplateBlock } from '../../../../domain/entities/page-template-block.entity';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { PageTemplateBlockRepository } from '../../../../domain/repositories/page-template-block.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';
import { PageTemplateResponseDto } from '../../../dto/page-template/page-template.response.dto';
import { TemplateVersionResponseDto } from '../../../dto/template-version/template-version.response.dto';
import { CreatePageTemplateCommand } from './create-page-template.command';

export type CreatePageTemplateResult = {
  template: PageTemplateResponseDto;
  version: TemplateVersionResponseDto;
};

@Injectable()
export class CreatePageTemplateHandler {
  constructor(
    @Inject(CONTENT_TYPES.ports.PageSnapshotReader)
    private readonly pageSnapshotReader: ContentPageSnapshotReaderPort,

    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    @Inject(TEMPLATE_TYPES.repositories.PageTemplateBlockRepository)
    private readonly pageTemplateBlockRepository: PageTemplateBlockRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    command: CreatePageTemplateCommand,
  ): Promise<CreatePageTemplateResult> {
    return this.unitOfWork.runInTransaction(async (context) => {
      const snapshot = await this.pageSnapshotReader.getPageSnapshot(
        command.pageId,
        context,
      );

      if (!snapshot) {
        throw new NotFoundException('Page not found');
      }

      const template = PageTemplate.create({
        sourcePageId: snapshot.page.id,
        workspaceId: snapshot.page.workspaceId,
        name: command.name ?? snapshot.page.title,
        description: command.description ?? null,
        icon: command.icon !== undefined ? command.icon : snapshot.page.icon,
        coverUrl:
          command.coverUrl !== undefined
            ? command.coverUrl
            : snapshot.page.coverUrl,
        createdBy: command.userId,

        // visibility chỉ truyền nếu create() thực sự nhận
        ...(command.visibility !== undefined
          ? { visibility: command.visibility }
          : {}),
      });

      const savedTemplate = await this.pageTemplateRepository.create(
        template,
        context,
      );

      const version = TemplateVersion.create({
        templateId: savedTemplate.getId(),
        versionNumber: 1,
        createdBy: command.userId,
      });

      const savedVersion = await this.templateVersionRepository.create(
        version,
        context,
      );

      const sortedBlocks = this.sortBlocks(snapshot.blocks);
      const sourceIdToTemplateBlockId = new Map<string, string>();
      const templateBlocks: PageTemplateBlock[] = [];

      for (const input of sortedBlocks) {
        let parentBlockId: string | null = null;

        if (input.parentSourceId) {
          const mappedParentId = sourceIdToTemplateBlockId.get(
            input.parentSourceId,
          );

          if (!mappedParentId) {
            throw new BadRequestException(
              `Page block parent "${input.parentSourceId}" could not be resolved`,
            );
          }

          parentBlockId = mappedParentId;
        }

        const block = PageTemplateBlock.create({
          versionId: savedVersion.getId(),
          parentBlockId,
          type: input.type,
          title: input.title,
          positionX: input.positionX,
          positionY: input.positionY,
          width: input.width,
          height: input.height,
          orderIndex: input.orderIndex,
          content: input.content,
          styleConfig: input.styleConfig,
          dataConfig: input.dataConfig,
          createdBy: command.userId,
          isOpen: input.isOpen,
        });

        sourceIdToTemplateBlockId.set(input.sourceId, block.getId());
        templateBlocks.push(block);
      }

      await this.pageTemplateBlockRepository.saveMany(templateBlocks, context);

      return {
        template: PageTemplateResponseDto.fromDomain(savedTemplate),
        version: TemplateVersionResponseDto.fromDomain(savedVersion),
      };
    });
  }

  private sortBlocks(
    blocks: ContentPageBlockSnapshot[],
  ): ContentPageBlockSnapshot[] {
    const bySourceId = new Map<string, ContentPageBlockSnapshot>();

    for (const block of blocks) {
      if (!block.sourceId.trim()) {
        throw new BadRequestException('Page block sourceId is required');
      }

      if (bySourceId.has(block.sourceId)) {
        throw new BadRequestException(
          `Duplicate page block sourceId: ${block.sourceId}`,
        );
      }

      bySourceId.set(block.sourceId, block);
    }

    for (const block of blocks) {
      if (!block.parentSourceId) {
        continue;
      }

      if (block.parentSourceId === block.sourceId) {
        throw new BadRequestException(
          `Page block "${block.sourceId}" cannot be its own parent`,
        );
      }

      if (!bySourceId.has(block.parentSourceId)) {
        throw new BadRequestException(
          `Page block parent "${block.parentSourceId}" does not exist`,
        );
      }
    }

    const result: ContentPageBlockSnapshot[] = [];
    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (sourceId: string): void => {
      if (visited.has(sourceId)) {
        return;
      }

      if (visiting.has(sourceId)) {
        throw new BadRequestException('Page block hierarchy contains a cycle');
      }

      const block = bySourceId.get(sourceId);

      if (!block) {
        throw new BadRequestException(
          `Page block "${sourceId}" does not exist`,
        );
      }

      visiting.add(sourceId);

      if (block.parentSourceId) {
        visit(block.parentSourceId);
      }

      visiting.delete(sourceId);
      visited.add(sourceId);
      result.push(block);
    };

    for (const block of blocks) {
      visit(block.sourceId);
    }

    return result;
  }
}
