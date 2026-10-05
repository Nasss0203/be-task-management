import { TemplateVersionStatus } from '../../../../domain/enums/template-version-status.enum';
import { TemplateVersion } from '../../../../domain/aggregates/template-version/template-version.aggregate';
import { PageTemplateVersionOrmEntity } from '../entities/page-template-version.orm-entity';
import { TemplateVersionMapper } from './template-version.mapper';

describe('TemplateVersionMapper snapshot hash', () => {
  it('preserves snapshotHash across domain and ORM mapping', () => {
    const domain = TemplateVersion.create({
      id: 'version-1',
      templateId: 'template-1',
      versionNumber: 1,
      createdBy: 'user-1',
      snapshotHash: 'c'.repeat(64),
    });

    const orm = TemplateVersionMapper.toOrm(domain);
    const restored = TemplateVersionMapper.toDomain(orm);

    expect(orm).toBeInstanceOf(PageTemplateVersionOrmEntity);
    expect(orm.snapshotHash).toBe('c'.repeat(64));
    expect(restored.getSnapshotHash()).toBe('c'.repeat(64));
  });

  it('maps legacy ORM rows without a hash to null', () => {
    const orm = Object.assign(new PageTemplateVersionOrmEntity(), {
      id: 'version-1',
      templateId: 'template-1',
      versionNumber: 1,
      status: TemplateVersionStatus.DRAFT,
      createdBy: 'user-1',
      snapshotHash: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      publishedAt: null,
    });

    expect(TemplateVersionMapper.toDomain(orm).getSnapshotHash()).toBeNull();
  });
});
