import { ConflictException } from '@nestjs/common';

import { TemplateVersionAsset } from 'src/modules/template/domain/entities/template-version-asset.entity';
import { TemplateVersionAssetProvider } from 'src/modules/template/domain/enums/template-version-asset-provider.enum';
import { TemplateVersionAssetStatus } from 'src/modules/template/domain/enums/template-version-asset-status.enum';
import { TemplateVersionAssetType } from 'src/modules/template/domain/enums/template-version-asset-type.enum';
import type { TemplateVersionAssetRepository } from 'src/modules/template/domain/repositories/template-version-asset.repository';
import type { TemplateVersionRepository } from 'src/modules/template/domain/repositories/template-version.repository';
import type { ObjectStoragePort } from 'src/shared/application/ports/object-storage.port';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import type { TemplateThumbnailRenderer } from '../../ports/template-thumbnail-renderer.port';
import { GenerateTemplateVersionThumbnailCommand } from './generate-template-version-thumbnail.command';
import { GenerateTemplateVersionThumbnailHandler } from './generate-template-version-thumbnail.handler';

function pendingAsset(updatedAt: Date): TemplateVersionAsset {
  return TemplateVersionAsset.restore({
    id: 'asset-1',
    templateVersionId: 'version-1',
    assetType: TemplateVersionAssetType.THUMBNAIL,
    provider: TemplateVersionAssetProvider.S3,
    storageKey: 'templates/template-1/versions/version-1/thumbnail.png',
    mimeType: null,
    fileSize: null,
    width: null,
    height: null,
    status: TemplateVersionAssetStatus.PENDING,
    generatedAt: null,
    createdAt: updatedAt,
    updatedAt,
  });
}

describe('GenerateTemplateVersionThumbnailHandler', () => {
  let asset: TemplateVersionAsset;
  const render = jest.fn();
  const save = jest.fn((saved: TemplateVersionAsset) => Promise.resolve(saved));

  const handler = new GenerateTemplateVersionThumbnailHandler(
    {
      findById: jest
        .fn()
        .mockResolvedValue({ getTemplateId: () => 'template-1' }),
    } as unknown as TemplateVersionRepository,
    {
      findByVersionAndType: jest.fn(() => Promise.resolve(asset)),
      save,
    } as unknown as TemplateVersionAssetRepository,
    { render } as unknown as TemplateThumbnailRenderer,
    {
      upload: jest.fn().mockResolvedValue({ size: 10 }),
    } as unknown as ObjectStoragePort,
    {
      runInTransaction: (work: (context: unknown) => Promise<unknown>) =>
        work({}),
    } as unknown as UnitOfWork,
  );

  const command = new GenerateTemplateVersionThumbnailCommand(
    'template-1',
    'version-1',
  );

  beforeEach(() => {
    render.mockReset().mockResolvedValue({
      buffer: Buffer.from('png'),
      contentType: 'image/png',
      width: 1440,
      height: 900,
    });
    save.mockClear();
  });

  it('rejects a second run while a recent generation is pending', async () => {
    asset = pendingAsset(new Date(Date.now() - 60_000));

    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(render).not.toHaveBeenCalled();
  });

  it('renders again when a pending generation is stuck', async () => {
    asset = pendingAsset(new Date(Date.now() - 10 * 60_000));

    const result = await handler.execute(command);

    expect(render).toHaveBeenCalledTimes(1);
    expect(result.getStatus()).toBe(TemplateVersionAssetStatus.READY);
  });
});
