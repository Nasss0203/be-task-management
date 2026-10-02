import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ContentPageProvisioningPort } from 'src/modules/content/application/ports/content-page-provisioning.port';
import { CONTENT_TYPES } from 'src/modules/content/content.types';

import type { PageTemplateBlockRepository } from '../../../../domain/repositories/page-template-block.repository';
import type { PageTemplateRepository } from '../../../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../../../domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';

import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { UseTemplateCommand } from './use-template.command';

export type UseTemplateResult = {
  pageId: string;
};

@Injectable()
export class UseTemplateHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    @Inject(TEMPLATE_TYPES.repositories.PageTemplateBlockRepository)
    private readonly pageTemplateBlockRepository: PageTemplateBlockRepository,

    @Inject(CONTENT_TYPES.ports.PageProvisioning)
    private readonly pageProvisioningPort: ContentPageProvisioningPort,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async execute(command: UseTemplateCommand): Promise<UseTemplateResult> {
    return this.uow.runInTransaction(async (context) => {
      const template = await this.pageTemplateRepository.findById(
        command.templateId,
        context,
      );

      if (!template) {
        throw new NotFoundException('Page template not found');
      }

      const version = await this.templateVersionRepository.findById(
        command.versionId,
        context,
      );

      if (!version) {
        throw new NotFoundException('Template version not found');
      }

      if (version.getTemplateId() !== template.getId()) {
        throw new BadRequestException(
          'Template version does not belong to this template',
        );
      }

      version.ensureUsable();

      const templateBlocks =
        await this.pageTemplateBlockRepository.findByVersionId(
          version.getId(),
          context,
        );

      const result = await this.pageProvisioningPort.createPageFromSnapshot(
        {
          workspaceId: command.workspaceId,

          title: template.getName(),
          createdBy: command.userId,

          icon: template.getIcon(),
          coverUrl: template.getCoverUrl(),

          blocks: templateBlocks.map((block) => ({
            sourceId: block.getId(),
            parentSourceId: block.getParentBlockId(),

            type: block.getType(),
            title: block.getTitle(),

            positionX: block.getPositionX(),
            positionY: block.getPositionY(),
            width: block.getWidth(),
            height: block.getHeight(),

            orderIndex: block.getOrderIndex(),

            content: block.getContent(),
            styleConfig: block.getStyleConfig(),
            dataConfig: block.getDataConfig(),

            isOpen: block.getIsOpen(),
          })),
        },
        context,
      );

      return {
        pageId: result.pageId,
      };
    });
  }
}
