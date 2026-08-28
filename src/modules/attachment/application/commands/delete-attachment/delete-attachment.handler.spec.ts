import { DeleteAttachmentCommand } from './delete-attachment.command';
import { DeleteAttachmentHandler } from './delete-attachment.handler';

describe('DeleteAttachmentHandler', () => {
  const deleteAttachment = jest.fn();
  const handler = new DeleteAttachmentHandler({
    delete: deleteAttachment,
  } as never);

  beforeEach(() => jest.clearAllMocks());

  it('preserves hard-delete-only behavior', async () => {
    await handler.execute(new DeleteAttachmentCommand('att-1', 'user-1'));

    expect(deleteAttachment).toHaveBeenCalledWith('att-1');
  });
});
