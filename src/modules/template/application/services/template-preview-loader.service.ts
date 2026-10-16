import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TEMPLATE_TYPES } from '../../template.types';

import type { PageTemplateBlockRepository } from '../../domain/repositories/page-template-block.repository';
import type { PageTemplateDatabaseSnapshotRepository } from '../../domain/repositories/page-template-database-snapshot.repository';
import type { PageTemplateRepository } from '../../domain/repositories/page-template.repository';
import type { TemplateVersionRepository } from '../../domain/repositories/template-version.repository';

import { PageTemplate } from '../../domain/aggregates/page-template/page-template.aggregate';
import { TemplateVersion } from '../../domain/aggregates/template-version/template-version.aggregate';
import { PageTemplateResponseDto } from '../dto/page-template/page-template.response.dto';
import { PageTemplateBlockResponseDto } from '../dto/template-block/page-template-block.response.dto';
import { PageTemplateDatabaseResponseDto } from '../dto/template-preview/page-template-database.response.dto';
import { TemplatePreviewResponseDto } from '../dto/template-preview/template-preview.response.dto';
import { TemplateVersionResponseDto } from '../dto/template-version/template-version.response.dto';

@Injectable()
export class TemplatePreviewLoader {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.PageTemplateRepository)
    private readonly pageTemplateRepository: PageTemplateRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    @Inject(TEMPLATE_TYPES.repositories.PageTemplateBlockRepository)
    private readonly pageTemplateBlockRepository: PageTemplateBlockRepository,

    @Inject(TEMPLATE_TYPES.repositories.PageTemplateDatabaseSnapshotRepository)
    private readonly templateDatabaseSnapshotRepository: PageTemplateDatabaseSnapshotRepository,
  ) {}

  async loadByIds(
    templateId: string,
    versionId: string,
  ): Promise<TemplatePreviewResponseDto> {
    const template = await this.pageTemplateRepository.findById(templateId);

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const version = await this.templateVersionRepository.findById(versionId);

    if (!version) {
      throw new NotFoundException('Template version not found');
    }

    return this.loadFrom(template, version);
  }

  async loadFrom(
    template: PageTemplate,
    version: TemplateVersion,
  ): Promise<TemplatePreviewResponseDto> {
    if (version.getTemplateId() !== template.getId()) {
      throw new BadRequestException(
        'Template version does not belong to the requested template',
      );
    }

    const versionId = version.getId();

    const [blocks, databases] = await Promise.all([
      this.pageTemplateBlockRepository.findByVersionId(versionId),
      this.templateDatabaseSnapshotRepository.findByVersionId(versionId),
    ]);

    return new TemplatePreviewResponseDto({
      template: PageTemplateResponseDto.fromDomain(template),

      version: TemplateVersionResponseDto.fromDomain(version),

      blocks: blocks.map((block) =>
        PageTemplateBlockResponseDto.fromDomain(block),
      ),

      databases: databases.map((database) =>
        PageTemplateDatabaseResponseDto.fromDomain(database),
      ),
    });
  }
}
