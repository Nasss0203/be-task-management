import { Repository } from 'typeorm';
import { AttachmentAggregate } from '../../../../domain/aggregates/attachment.aggregate';
import { AttachmentProvider } from '../../../../domain/enums/attachment-provider.enum';
import { AttachmentStatus } from '../../../../domain/enums/attachment-status.enum';
import { AttachmentOrmEntity } from '../entities/attachment.orm-entity';
import { TypeOrmAttachmentRepository } from './typeorm-attachment.repository';

const createAggregate = () =>
  AttachmentAggregate.reconstitute({
    id: 'att-1',
    workspaceId: 'ws-1',
    taskId: 'task-1',
    commentId: null,
    uploadedBy: 'user-1',
    fileName: 'test.pdf',
    mimeType: 'application/pdf',
    size: 1024,
    provider: AttachmentProvider.R2,
    storageKey: 'key',
    publicId: null,
    url: null,
    secureUrl: null,
    status: AttachmentStatus.READY,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });

describe('TypeOrmAttachmentRepository', () => {
  const saveMock = jest.fn();
  const findOneMock = jest.fn();
  const findMock = jest.fn();
  const deleteMock = jest.fn();
  const ormRepository = {
    save: saveMock,
    findOne: findOneMock,
    find: findMock,
    delete: deleteMock,
  } as unknown as jest.Mocked<Repository<AttachmentOrmEntity>>;

  const repository = new TypeOrmAttachmentRepository(ormRepository);

  beforeEach(() => jest.clearAllMocks());

  it('saves and returns an aggregate', async () => {
    const aggregate = createAggregate();
    saveMock.mockResolvedValue(
      Object.assign(new AttachmentOrmEntity(), {
        id: aggregate.getId(),
        workspaceId: aggregate.getWorkspaceId(),
        taskId: aggregate.getTaskId(),
        commentId: aggregate.getCommentId(),
        uploadedBy: aggregate.getUploadedBy(),
        fileName: aggregate.getFileName(),
        mimeType: aggregate.getMimeType(),
        size: aggregate.getSize(),
        provider: aggregate.getProvider(),
        storageKey: aggregate.getStorageKey(),
        publicId: aggregate.getPublicId(),
        url: aggregate.getUrl(),
        secureUrl: aggregate.getSecureUrl(),
        status: aggregate.getStatus(),
        createdAt: aggregate.getCreatedAt(),
        updatedAt: aggregate.getUpdatedAt(),
      }),
    );

    const result = await repository.save(aggregate);

    expect(saveMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'att-1', storageKey: 'key' }),
    );
    expect(result.getId()).toBe('att-1');
  });

  it('finds a READY attachment by id', async () => {
    findOneMock.mockResolvedValue(null);

    await expect(repository.findReadyById('att-1')).resolves.toBeNull();
    expect(findOneMock).toHaveBeenCalledWith({
      where: { id: 'att-1', status: AttachmentStatus.READY },
    });
  });

  it('finds READY attachments by task newest first', async () => {
    findMock.mockResolvedValue([]);

    await expect(repository.findReadyByTaskId('task-1')).resolves.toEqual([]);
    expect(findMock).toHaveBeenCalledWith({
      where: { taskId: 'task-1', status: AttachmentStatus.READY },
      order: { createdAt: 'DESC' },
    });
  });

  it('hard deletes without requiring an affected row', async () => {
    deleteMock.mockResolvedValue({ raw: [], affected: 0 });

    await repository.delete('att-1');

    expect(deleteMock).toHaveBeenCalledWith('att-1');
  });
});
