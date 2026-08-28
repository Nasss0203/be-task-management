import { AttachmentAggregate } from '../../../../domain/aggregates/attachment.aggregate';
import { AttachmentProvider } from '../../../../domain/enums/attachment-provider.enum';
import { AttachmentStatus } from '../../../../domain/enums/attachment-status.enum';
import { AttachmentOrmEntity } from '../entities/attachment.orm-entity';
import { AttachmentPersistenceMapper } from './attachment.persistence-mapper';

const state = {
  id: 'att-1',
  workspaceId: 'ws-1',
  taskId: 'task-1',
  commentId: null,
  uploadedBy: 'user-1',
  fileName: 'file.pdf',
  mimeType: 'application/pdf',
  size: 100,
  provider: AttachmentProvider.R2,
  storageKey: 'key',
  publicId: null,
  url: null,
  secureUrl: null,
  status: AttachmentStatus.READY,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('AttachmentPersistenceMapper', () => {
  it('maps ORM persistence state to the aggregate', () => {
    const aggregate = AttachmentPersistenceMapper.toDomain(
      Object.assign(new AttachmentOrmEntity(), state),
    );

    expect(aggregate).toBeInstanceOf(AttachmentAggregate);
    expect(aggregate.getId()).toBe('att-1');
    expect(aggregate.getStorageKey()).toBe('key');
  });

  it('maps the aggregate to the ORM entity', () => {
    const entity = AttachmentPersistenceMapper.toOrm(
      AttachmentAggregate.reconstitute(state),
    );

    expect(entity).toBeInstanceOf(AttachmentOrmEntity);
    expect(entity).toEqual(expect.objectContaining(state));
  });

  it('preserves nullable values in both directions', () => {
    const aggregate = AttachmentPersistenceMapper.toDomain(
      Object.assign(new AttachmentOrmEntity(), {
        ...state,
        taskId: null,
        storageKey: null,
        provider: AttachmentProvider.CLOUDINARY,
        publicId: 'public-id',
        url: 'http://url',
        secureUrl: 'https://url',
      }),
    );

    expect(aggregate.getTaskId()).toBeNull();
    expect(aggregate.getStorageKey()).toBeNull();
    expect(aggregate.getPublicId()).toBe('public-id');
  });
});
