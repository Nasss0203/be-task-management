import { Inject, Injectable } from '@nestjs/common';
import type { ContentPageProvisioningPort } from 'src/modules/content/application/ports/content-page-provisioning.port';
import { getPagePreset } from 'src/modules/content/application/services/page-presets';
import { CONTENT_TYPES } from 'src/modules/content/content.types';
import type { PageBlockRepository } from 'src/modules/content/domain/repositories/page-block.repository';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { ApplyPagePresetCommand } from './apply-page-preset.command';

@Injectable()
export class ApplyPagePresetHandler {
  constructor(
    @Inject(CONTENT_TYPES.repositories.PageBlockRepository)
    private readonly pageBlockRepo: PageBlockRepository,

    @Inject(CONTENT_TYPES.ports.PageProvisioning)
    private readonly pageProvisioning: ContentPageProvisioningPort,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: ApplyPagePresetCommand): Promise<void> {
    const preset = getPagePreset(command.preset);

    await this.uow.runInTransaction(async (context) => {
      const existingBlocks = await this.pageBlockRepo.findByPageId(
        command.pageId,
        context,
      );

      existingBlocks.forEach((block) => block.markAsDeleted(command.userId));
      await this.pageBlockRepo.saveMany(existingBlocks, context);

      await this.pageProvisioning.createBlocksFromSnapshot(
        {
          pageId: command.pageId,
          createdBy: command.userId,
          blocks: preset.blocks,
        },
        context,
      );
    });
  }
}
