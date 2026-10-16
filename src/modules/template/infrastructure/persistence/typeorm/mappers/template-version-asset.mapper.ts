import { TemplateVersionAsset } from '../../../../domain/entities/template-version-asset.entity';
import { TemplateVersionAssetOrmEntity } from '../entities/template-version-asset.orm-entity';

export class TemplateVersionAssetMapper {
  static toDomain(entity: TemplateVersionAssetOrmEntity): TemplateVersionAsset {
    return TemplateVersionAsset.restore({
      id: entity.id,
      templateVersionId: entity.templateVersionId,
      assetType: entity.assetType,
      provider: entity.provider,
      storageKey: entity.storageKey,
      mimeType: entity.mimeType,
      fileSize: entity.fileSize,
      width: entity.width,
      height: entity.height,
      status: entity.status,
      generatedAt: entity.generatedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toOrm(domain: TemplateVersionAsset): TemplateVersionAssetOrmEntity {
    const entity = new TemplateVersionAssetOrmEntity();
    entity.id = domain.getId();
    entity.templateVersionId = domain.getTemplateVersionId();
    entity.assetType = domain.getAssetType();
    entity.provider = domain.getProvider();
    entity.storageKey = domain.getStorageKey();
    entity.mimeType = domain.getMimeType();
    entity.fileSize = domain.getFileSize();
    entity.width = domain.getWidth();
    entity.height = domain.getHeight();
    entity.status = domain.getStatus();
    entity.generatedAt = domain.getGeneratedAt();
    entity.createdAt = domain.getCreatedAt();
    entity.updatedAt = domain.getUpdatedAt();
    return entity;
  }
}
