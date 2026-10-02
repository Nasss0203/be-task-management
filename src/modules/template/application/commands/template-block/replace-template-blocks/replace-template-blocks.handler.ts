import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PageTemplateBlock } from '../../../../domain/entities/page-template-block.entity';
import type { PageTemplateBlockRepository } from '../../../../domain/repositories/page-template-block.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import {
  ReplaceTemplateBlocksCommand,
  type ReplaceTemplateBlockInput,
} from './replace-template-blocks.command';

@Injectable()
export class ReplaceTemplateBlocksHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    @Inject(TEMPLATE_TYPES.repositories.PageTemplateBlockRepository)
    private readonly pageTemplateBlockRepository: PageTemplateBlockRepository,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    command: ReplaceTemplateBlocksCommand,
  ): Promise<PageTemplateBlock[]> {
    return this.unitOfWork.runInTransaction(async (context) => {
      const version = await this.templateVersionRepository.findByIdForUpdate(
        command.versionId,
        context,
      );

      if (!version) {
        throw new NotFoundException('Template version not found');
      }

      // PUBLISHED version không được sửa content
      version.ensureEditable();

      // Validate + sắp xếp parent trước child
      const sortedInputs = this.sortBlocks(command.blocks);

      // sourceId -> generated TemplateBlock ID
      const createdIdMap = new Map<string, string>();

      const blocks: PageTemplateBlock[] = [];

      for (const input of sortedInputs) {
        let parentBlockId: string | null = null;

        if (input.parentSourceId) {
          const mappedParentId = createdIdMap.get(input.parentSourceId);

          if (!mappedParentId) {
            throw new BadRequestException(
              `Template block parent "${input.parentSourceId}" could not be resolved`,
            );
          }

          parentBlockId = mappedParentId;
        }

        const block = PageTemplateBlock.create({
          versionId: command.versionId,
          parentBlockId,

          type: input.type,
          title: input.title ?? null,

          positionX: input.positionX,
          positionY: input.positionY,
          width: input.width,
          height: input.height,

          orderIndex: input.orderIndex,

          content: input.content ?? null,
          styleConfig: input.styleConfig ?? null,
          dataConfig: input.dataConfig ?? null,

          createdBy: command.userId,
          isOpen: input.isOpen ?? true,
        });

        createdIdMap.set(input.sourceId, block.getId());

        blocks.push(block);
      }

      // Replace toàn bộ snapshot trong cùng transaction.
      // Nếu saveMany fail => transaction rollback => block cũ vẫn còn.
      await this.pageTemplateBlockRepository.deleteByVersionId(
        command.versionId,
        context,
      );

      return this.pageTemplateBlockRepository.saveMany(blocks, context);
    });
  }

  /**
   * Validate:
   * - sourceId không được trùng
   * - parentSourceId phải tồn tại
   * - block không được parent chính nó
   * - hierarchy không được cycle
   *
   * Đồng thời trả về thứ tự:
   * parent trước child
   */
  private sortBlocks(
    blocks: ReplaceTemplateBlockInput[],
  ): ReplaceTemplateBlockInput[] {
    const bySourceId = new Map<string, ReplaceTemplateBlockInput>();

    for (const block of blocks) {
      if (!block.sourceId?.trim()) {
        throw new BadRequestException('Template block sourceId is required');
      }

      if (bySourceId.has(block.sourceId)) {
        throw new BadRequestException(
          `Duplicate template block sourceId: ${block.sourceId}`,
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
          `Template block "${block.sourceId}" cannot be its own parent`,
        );
      }

      if (!bySourceId.has(block.parentSourceId)) {
        throw new BadRequestException(
          `Template block parent "${block.parentSourceId}" does not exist`,
        );
      }
    }

    const result: ReplaceTemplateBlockInput[] = [];

    const visiting = new Set<string>();
    const visited = new Set<string>();

    const visit = (sourceId: string): void => {
      if (visited.has(sourceId)) {
        return;
      }

      if (visiting.has(sourceId)) {
        throw new BadRequestException(
          'Template block hierarchy contains a cycle',
        );
      }

      const block = bySourceId.get(sourceId);

      if (!block) {
        throw new BadRequestException(
          `Template block "${sourceId}" does not exist`,
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
