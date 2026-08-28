import { Test, TestingModule } from '@nestjs/testing';
import type { IAuth } from 'src/types/auth';
import { DeleteAttachmentHandler } from '../../../application/commands/delete-attachment/delete-attachment.handler';
import { UpdateAttachmentHandler } from '../../../application/commands/update-attachment/update-attachment.handler';
import { UploadAttachmentHandler } from '../../../application/commands/upload-attachment/upload-attachment.handler';
import { CreateAttachmentDownloadUrlHandler } from '../../../application/queries/create-attachment-download-url/create-attachment-download-url.handler';
import { GetAttachmentsByTaskHandler } from '../../../application/queries/get-attachments-by-task/get-attachments-by-task.handler';
import { AttachmentController } from './attachment.controller';

describe('AttachmentController', () => {
  const uploadExecute = jest.fn();
  const getByTaskExecute = jest.fn();
  const createUrlExecute = jest.fn();
  const updateExecute = jest.fn();
  const deleteExecute = jest.fn();
  let controller: AttachmentController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttachmentController],
      providers: [
        {
          provide: UploadAttachmentHandler,
          useValue: { execute: uploadExecute },
        },
        {
          provide: GetAttachmentsByTaskHandler,
          useValue: { execute: getByTaskExecute },
        },
        {
          provide: CreateAttachmentDownloadUrlHandler,
          useValue: { execute: createUrlExecute },
        },
        {
          provide: UpdateAttachmentHandler,
          useValue: { execute: updateExecute },
        },
        {
          provide: DeleteAttachmentHandler,
          useValue: { execute: deleteExecute },
        },
      ],
    }).compile();

    controller = module.get(AttachmentController);
  });

  it('is defined', () => expect(controller).toBeDefined());

  it('maps a Multer file and HTTP input to UploadAttachmentCommand', async () => {
    uploadExecute.mockResolvedValue({ id: 'att-1' });
    const file = {
      originalname: 'test.png',
      mimetype: 'image/png',
      size: 1024,
      buffer: Buffer.from('image'),
    } as Express.Multer.File;

    await expect(
      controller.upload('ws-1', { taskId: 'task-1' }, file, {
        id: 'user-1',
      } as IAuth),
    ).resolves.toEqual({ id: 'att-1' });
    expect(uploadExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-1',
        taskId: 'task-1',
        commentId: null,
        actorId: 'user-1',
        file: {
          originalName: 'test.png',
          reportedMimeType: 'image/png',
          size: 1024,
          buffer: file.buffer,
        },
      }),
    );
  });

  it('delegates task listing', async () => {
    getByTaskExecute.mockResolvedValue([{ id: 'att-1' }]);

    await controller.findByTask('task-1');

    expect(getByTaskExecute).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: 'task-1' }),
    );
  });

  it('delegates download URL creation with the actor', async () => {
    await controller.createDownloadUrl('att-1', {
      id: 'user-1',
    } as IAuth);

    expect(createUrlExecute).toHaveBeenCalledWith(
      expect.objectContaining({ attachmentId: 'att-1', actorId: 'user-1' }),
    );
  });

  it('preserves the empty update request behavior', async () => {
    await controller.update('att-1', {}, { id: 'user-1' } as IAuth);

    expect(updateExecute).toHaveBeenCalledWith(
      expect.objectContaining({ attachmentId: 'att-1', actorId: 'user-1' }),
    );
  });

  it('delegates hard delete with the actor', async () => {
    await controller.delete('att-1', { id: 'user-1' } as IAuth);

    expect(deleteExecute).toHaveBeenCalledWith(
      expect.objectContaining({ attachmentId: 'att-1', actorId: 'user-1' }),
    );
  });
});
