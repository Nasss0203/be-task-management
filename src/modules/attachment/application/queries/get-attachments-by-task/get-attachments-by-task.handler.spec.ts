import { AttachmentAggregate } from '../../../domain/aggregates/attachment.aggregate';
import { AttachmentProvider } from '../../../domain/enums/attachment-provider.enum';
import { AttachmentStatus } from '../../../domain/enums/attachment-status.enum';
import { GetAttachmentsByTaskHandler } from './get-attachments-by-task.handler';
import { GetAttachmentsByTaskQuery } from './get-attachments-by-task.query';

describe('GetAttachmentsByTaskHandler', () => {
  const findReadyByTaskId = jest.fn();
  const handler = new GetAttachmentsByTaskHandler({
    findReadyByTaskId,
  } as never);

  beforeEach(() => jest.clearAllMocks());

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
      new GetAttachmentsByTaskQuery('task-1'),
    );

    expect(findReadyByTaskId).toHaveBeenCalledWith('task-1');
    expect(result).toEqual([
      expect.objectContaining({ id: 'att-1', storageKey: 'key' }),
    ]);
  });
});
