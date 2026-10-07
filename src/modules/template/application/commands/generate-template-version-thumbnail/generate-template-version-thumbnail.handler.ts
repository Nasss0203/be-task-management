import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TemplateVersionAsset } from 'src/modules/template/domain/entities/template-version-asset.entity';
import { TemplateVersionAssetProvider } from 'src/modules/template/domain/enums/template-version-asset-provider.enum';
import { TemplateVersionAssetStatus } from 'src/modules/template/domain/enums/template-version-asset-status.enum';
import { TemplateVersionAssetType } from 'src/modules/template/domain/enums/template-version-asset-type.enum';
import type { TemplateVersionAssetRepository } from 'src/modules/template/domain/repositories/template-version-asset.repository';
import type { TemplateVersionRepository } from 'src/modules/template/domain/repositories/template-version.repository';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';

import type { ObjectStoragePort } from 'src/shared/application/ports/object-storage.port';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { STORAGE_TYPES } from 'src/shared/infrastructure/storage/storage.types';

import type { TemplateThumbnailRenderer } from '../../ports/template-thumbnail-renderer.port';
import { GenerateTemplateVersionThumbnailCommand } from './generate-template-version-thumbnail.command';

@Injectable()
export class GenerateTemplateVersionThumbnailHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionRepository)
    private readonly templateVersionRepository: TemplateVersionRepository,

    @Inject(TEMPLATE_TYPES.repositories.TemplateVersionAssetRepository)
    private readonly templateVersionAssetRepository: TemplateVersionAssetRepository,

    @Inject(TEMPLATE_TYPES.services.TemplateThumbnailRenderer)
    private readonly thumbnailRenderer: TemplateThumbnailRenderer,

    @Inject(STORAGE_TYPES.ObjectStorage)
    private readonly objectStorage: ObjectStoragePort,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(
    command: GenerateTemplateVersionThumbnailCommand,
  ): Promise<TemplateVersionAsset> {
    const version = await this.templateVersionRepository.findById(
      command.versionId,
    );

    if (!version) {
      throw new NotFoundException('Template version not found');
    }

    if (version.getTemplateId() !== command.templateId) {
      throw new NotFoundException('Template version not found');
    }

    const storageKey = `templates/${command.templateId}/versions/${command.versionId}/thumbnail.png`;

    const asset = await this.unitOfWork.runInTransaction(async (context) => {
      const existing =
        await this.templateVersionAssetRepository.findByVersionAndType(
          command.versionId,
          TemplateVersionAssetType.THUMBNAIL,
          context,
        );

      if (existing?.getStatus() === TemplateVersionAssetStatus.READY) {
        return existing;
      }

      if (existing?.getStatus() === TemplateVersionAssetStatus.PENDING) {
        throw new ConflictException(
          'Template thumbnail generation is already in progress',
        );
      }

      if (existing?.getStatus() === TemplateVersionAssetStatus.FAILED) {
        existing.markPending();

        return this.templateVersionAssetRepository.save(existing, context);
      }

      const pending = TemplateVersionAsset.create({
        templateVersionId: command.versionId,
        assetType: TemplateVersionAssetType.THUMBNAIL,
        provider: TemplateVersionAssetProvider.S3,
        storageKey,
      });

      return this.templateVersionAssetRepository.create(pending, context);
    });

    if (asset.getStatus() === TemplateVersionAssetStatus.READY) {
      return asset;
    }

    try {
      const rendered = await this.thumbnailRenderer.render({
        templateId: command.templateId,
        versionId: command.versionId,
      });

      const stored = await this.objectStorage.upload({
        key: storageKey,
        body: rendered.buffer,
        contentType: rendered.contentType,
      });

      const readyAsset = await this.unitOfWork.runInTransaction(
        async (context) => {
          const current =
            await this.templateVersionAssetRepository.findByVersionAndType(
              command.versionId,
              TemplateVersionAssetType.THUMBNAIL,
              context,
            );

          if (!current) {
            throw new NotFoundException('Template thumbnail asset not found');
          }

          current.markReady({
            mimeType: rendered.contentType,
            fileSize: stored.size,
            width: rendered.width,
            height: rendered.height,
          });

          return this.templateVersionAssetRepository.save(current, context);
        },
      );

      return readyAsset;
    } catch (error) {
      try {
        await this.unitOfWork.runInTransaction(async (context) => {
          const current =
            await this.templateVersionAssetRepository.findByVersionAndType(
              command.versionId,
              TemplateVersionAssetType.THUMBNAIL,
              context,
            );

          if (!current) {
            return;
          }

          current.markFailed();

          await this.templateVersionAssetRepository.save(current, context);
        });
      } catch (markFailedError) {}

      throw error;
    }
  }
}
