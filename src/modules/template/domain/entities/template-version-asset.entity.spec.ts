import { TemplateVersionAssetProvider } from '../enums/template-version-asset-provider.enum';
import { TemplateVersionAssetStatus } from '../enums/template-version-asset-status.enum';
import { TemplateVersionAssetType } from '../enums/template-version-asset-type.enum';
import { TemplateVersionAsset } from './template-version-asset.entity';

describe('TemplateVersionAsset', () => {
  it('creates a pending asset with generation fields unset', () => {
    const asset = TemplateVersionAsset.create({
      id: 'asset-1',
      templateVersionId: 'version-1',
      assetType: TemplateVersionAssetType.THUMBNAIL,
      provider: TemplateVersionAssetProvider.S3,
      storageKey: 'templates/template-1/versions/version-1/thumbnail.webp',
    });

    expect(asset.getStatus()).toBe(TemplateVersionAssetStatus.PENDING);
    expect(asset.getMimeType()).toBeNull();
    expect(asset.getFileSize()).toBeNull();
    expect(asset.getWidth()).toBeNull();
    expect(asset.getHeight()).toBeNull();
    expect(asset.getGeneratedAt()).toBeNull();
  });

  it('restores and transitions an asset through ready state', () => {
    const createdAt = new Date('2026-01-01T00:00:00.000Z');
    const updatedAt = new Date('2026-01-01T00:00:01.000Z');
    const asset = TemplateVersionAsset.restore({
      id: 'asset-1',
      templateVersionId: 'version-1',
      assetType: TemplateVersionAssetType.THUMBNAIL,
      provider: TemplateVersionAssetProvider.S3,
      storageKey: 'templates/template-1/versions/version-1/thumbnail.webp',
      mimeType: null,
      fileSize: null,
      width: null,
      height: null,
      status: TemplateVersionAssetStatus.PENDING,
      generatedAt: null,
      createdAt,
      updatedAt,
    });

    const generatedAt = new Date('2026-01-01T00:01:00.000Z');
    asset.markReady({
      mimeType: 'image/webp',
      fileSize: 1024,
      width: 1200,
      height: 800,
      generatedAt,
    });

    expect(asset.getStatus()).toBe(TemplateVersionAssetStatus.READY);
    expect(asset.getMimeType()).toBe('image/webp');
    expect(asset.getFileSize()).toBe(1024);
    expect(asset.getWidth()).toBe(1200);
    expect(asset.getHeight()).toBe(800);
    expect(asset.getGeneratedAt()).toBe(generatedAt);
    expect(asset.getCreatedAt()).toBe(createdAt);
    expect(asset.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(
      updatedAt.getTime(),
    );
  });

  it('rejects invalid ready metadata', () => {
    const asset = TemplateVersionAsset.create({
      templateVersionId: 'version-1',
      assetType: TemplateVersionAssetType.THUMBNAIL,
      provider: TemplateVersionAssetProvider.S3,
      storageKey: 'thumbnail.webp',
    });

    expect(() =>
      asset.markReady({
        mimeType: 'image/webp',
        fileSize: 10,
        width: 0,
        height: 800,
      }),
    ).toThrow('Ready asset dimensions must be greater than zero');
  });
});
