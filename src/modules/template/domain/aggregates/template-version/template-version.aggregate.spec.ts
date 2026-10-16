import { TemplateVersionStatus } from '../../enums/template-version-status.enum';
import { TemplateVersion } from './template-version.aggregate';

describe('TemplateVersion snapshot hash', () => {
  it('defaults the hash to null for existing callers', () => {
    const version = TemplateVersion.create({
      templateId: 'template-1',
      versionNumber: 1,
      createdBy: 'user-1',
    });

    expect(version.getSnapshotHash()).toBeNull();
  });

  it('preserves a hash supplied during creation', () => {
    const hash = 'a'.repeat(64);
    const version = TemplateVersion.create({
      templateId: 'template-1',
      versionNumber: 1,
      createdBy: 'user-1',
      snapshotHash: hash,
    });

    expect(version.getSnapshotHash()).toBe(hash);
  });

  it.each([null, 'b'.repeat(64)])(
    'restores nullable hash value %s without deriving it',
    (snapshotHash) => {
      const version = TemplateVersion.restore({
        id: 'version-1',
        templateId: 'template-1',
        versionNumber: 1,
        status: TemplateVersionStatus.DRAFT,
        createdBy: 'user-1',
        snapshotHash,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        publishedAt: null,
      });

      expect(version.getSnapshotHash()).toBe(snapshotHash);
    },
  );
});
