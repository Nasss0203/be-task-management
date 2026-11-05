import { AttachmentAggregate } from '../../../domain/aggregates/attachment.aggregate';
import { AttachmentProvider } from '../../../domain/enums/attachment-provider.enum';
import { AttachmentStatus } from '../../../domain/enums/attachment-status.enum';
import { GetAttachmentsByTaskHandler } from './get-attachments-by-task.handler';
import { GetAttachmentsByTaskQuery } from './get-attachments-by-task.query';

const createAttachment = (id: string, workspaceId: string) =>
  AttachmentAggregate.reconstitute({
    id,
    workspaceId,
    taskId: 'task-1',
    commentId: null,
    pageBlockId: null,
    uploadedBy: 'user-1',
    fileName: 'file.pdf',
    mimeType: 'application/pdf',
    size: 10,
    provider: AttachmentProvider.R2,
    storageKey: 'key',
    publicId: null,
    url: null,
    secureUrl: null,
    status: AttachmentStatus.READY,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });

describe('GetAttachmentsByTaskHandler', () => {
  const findReadyByTaskId = jest.fn();
  const authorize = jest.fn<Promise<boolean>, [{ target: { id: string } }]>();
  const handler = new GetAttachmentsByTaskHandler(
    { findReadyByTaskId } as never,
    { authorize } as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    authorize.mockResolvedValue(true);
  });

  it('only returns attachments of workspaces the user can read', async () => {
    findReadyByTaskId.mockResolvedValue([
      createAttachment('att-1', 'ws-1'),
      createAttachment('att-2', 'ws-2'),
      createAttachment('att-3', 'ws-1'),
    ]);
    authorize.mockImplementation(({ target }) =>
      Promise.resolve(target.id === 'ws-1'),
    );

    const result = await handler.execute(
      new GetAttachmentsByTaskQuery('task-1', 'user-1'),
    );

    expect(result.map((attachment) => attachment.id)).toEqual([
      'att-1',
      'att-3',
    ]);
    expect(authorize).toHaveBeenCalledTimes(2);
    expect(authorize).toHaveBeenCalledWith({
      userId: 'user-1',
      permissions: ['attachment.read'],
      target: { type: 'workspace', id: 'ws-2' },
    });
  });

  it('queries READY attachments by task and maps their full response shape', async () => {
    findReadyByTaskId.mockResolvedValue([
      AttachmentAggregate.reconstitute({
        id: 'att-1',
        workspaceId: 'ws-1',
        taskId: 'task-1',
        commentId: null,
        uploadedBy: 'user-1',
        fileName: 'file.pdf',
        mimeType: 'application/pdf',
        size: 10,
        provider: AttachmentProvider.R2,
        storageKey: 'key',
        publicId: null,
        url: null,
        secureUrl: null,
        status: AttachmentStatus.READY,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    ]);

    const result = await handler.execute(
      new GetAttachmentsByTaskQuery('task-1', 'user-1'),
    );

    expect(findReadyByTaskId).toHaveBeenCalledWith('task-1');
    expect(result).toEqual([
      expect.objectContaining({ id: 'att-1', storageKey: 'key' }),
    ]);
  });
});
