import { NotFoundException } from '@nestjs/common';
import { AttachmentAggregate } from '../../../domain/aggregates/attachment.aggregate';
import { AttachmentProvider } from '../../../domain/enums/attachment-provider.enum';
import { AttachmentStatus } from '../../../domain/enums/attachment-status.enum';
import { UpdateAttachmentCommand } from './update-attachment.command';
import { UpdateAttachmentHandler } from './update-attachment.handler';

const attachment = AttachmentAggregate.reconstitute({
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
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('UpdateAttachmentHandler', () => {
  const findReadyById = jest.fn();
  const save = jest.fn();
  const handler = new UpdateAttachmentHandler({ findReadyById, save } as never);
  const command = new UpdateAttachmentCommand('att-1', 'user-1');

  beforeEach(() => jest.clearAllMocks());

  it('throws when attachment is not found', async () => {
    findReadyById.mockResolvedValue(null);

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });

  it('preserves the legacy no-field save behavior', async () => {
    findReadyById.mockResolvedValue(attachment);
    save.mockResolvedValue(attachment);

    const result = await handler.execute(command);

    expect(save).toHaveBeenCalledWith(attachment);
    expect(result).toEqual(expect.objectContaining({ id: 'att-1' }));
  });
});
