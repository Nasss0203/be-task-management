import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import { TemplateVersionAsset } from '../entities/template-version-asset.entity';
import { TemplateVersionAssetType } from '../enums/template-version-asset-type.enum';

export interface TemplateVersionAssetRepository {
  create(
    asset: TemplateVersionAsset,
    context?: PersistenceContext,
  ): Promise<TemplateVersionAsset>;

  save(
    asset: TemplateVersionAsset,
    context?: PersistenceContext,
  ): Promise<TemplateVersionAsset>;

  findByVersionAndType(
    templateVersionId: string,
    assetType: TemplateVersionAssetType,
    context?: PersistenceContext,
  ): Promise<TemplateVersionAsset | null>;
}
