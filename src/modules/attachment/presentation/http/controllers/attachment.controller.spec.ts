import { Test, TestingModule } from '@nestjs/testing';
import { PERMISSIONS_KEY } from 'src/common/decorator/require-permissions.decorator';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type { IAuth } from 'src/types/auth';
import { BulkDeleteWorkspaceFilesCommand } from '../../../application/commands/bulk-delete-workspace-files/bulk-delete-workspace-files.command';
import { BulkDeleteWorkspaceFilesHandler } from '../../../application/commands/bulk-delete-workspace-files/bulk-delete-workspace-files.handler';
import { DeleteAttachmentHandler } from '../../../application/commands/delete-attachment/delete-attachment.handler';
import { GetWorkspaceStorageHandler } from '../../../application/queries/get-workspace-storage/get-workspace-storage.handler';
import { ListWorkspaceStorageFilesHandler } from '../../../application/queries/list-workspace-storage-files/list-workspace-storage-files.handler';
import { ListWorkspaceStorageFilesQuery } from '../../../application/queries/list-workspace-storage-files/list-workspace-storage-files.query';
import { UpdateAttachmentHandler } from '../../../application/commands/update-attachment/update-attachment.handler';
import { UploadAttachmentHandler } from '../../../application/commands/upload-attachment/upload-attachment.handler';
import { CreateAttachmentDownloadUrlHandler } from '../../../application/queries/create-attachment-download-url/create-attachment-download-url.handler';
import { AttachmentController } from './attachment.controller';

describe('AttachmentController', () => {
  const uploadExecute = jest.fn();
  const createUrlExecute = jest.fn();
  const updateExecute = jest.fn();
  const deleteExecute = jest.fn();
  const listFilesExecute = jest.fn();
  const bulkDeleteExecute = jest.fn();
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
        {
          provide: GetWorkspaceStorageHandler,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ListWorkspaceStorageFilesHandler,
          useValue: { execute: listFilesExecute },
        },
        {
          provide: BulkDeleteWorkspaceFilesHandler,
          useValue: { execute: bulkDeleteExecute },
        },
      ],
    }).compile();

    controller = module.get(AttachmentController);
  });

  it('is defined', () => expect(controller).toBeDefined());

  it('requires the upload permission to update an attachment', () => {
    expect(
      Reflect.getMetadata(
        PERMISSIONS_KEY,
        Object.getOwnPropertyDescriptor(
          AttachmentController.prototype,
          'update',
        )?.value as object,
      ),
    ).toEqual([PERMISSIONS.ATTACHMENT_UPLOAD]);
  });

  it('maps a Multer file and HTTP input to UploadAttachmentCommand', async () => {
    uploadExecute.mockResolvedValue({ id: 'att-1' });
    const file = {
      originalname: 'test.png',
      mimetype: 'image/png',
      size: 1024,
      path: '/tmp/upload-1',
    } as Express.Multer.File;

    await expect(
      controller.upload('ws-1', { commentId: 'comment-1' }, file, {
        id: 'user-1',
      } as IAuth),
    ).resolves.toEqual({ id: 'att-1' });
    expect(uploadExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'ws-1',
        commentId: 'comment-1',
        pageBlockId: null,
        actorId: 'user-1',
        file: {
          originalName: 'test.png',
          reportedMimeType: 'image/png',
          size: 1024,
          path: '/tmp/upload-1',
        },
      }),
    );
  });

  it('decodes UTF-8 file names that Multer read as latin1', async () => {
    uploadExecute.mockResolvedValue({ id: 'att-1' });
    const utf8Name = 'Kế hoạch triển khai.pdf';
    const file = {
      originalname: Buffer.from(utf8Name, 'utf8').toString('latin1'),
      mimetype: 'application/pdf',
      size: 1024,
      path: '/tmp/upload-2',
    } as Express.Multer.File;

    await controller.upload('ws-1', {}, file, { id: 'user-1' } as IAuth);

    expect(uploadExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        file: expect.objectContaining({ originalName: utf8Name }),
      }),
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

  it('delegates workspace file listing with the actor and filters', async () => {
    await controller.listWorkspaceFiles('ws-1', { type: 'image', page: 2 }, {
      id: 'user-1',
    } as IAuth);

    expect(listFilesExecute).toHaveBeenCalledWith(
      new ListWorkspaceStorageFilesQuery('ws-1', 'user-1', {
        type: 'image',
        page: 2,
      }),
    );
  });

  it('delegates bulk delete with the actor', async () => {
    await controller.bulkDeleteWorkspaceFiles('ws-1', { ids: ['a1'] }, {
      id: 'user-1',
    } as IAuth);

    expect(bulkDeleteExecute).toHaveBeenCalledWith(
      new BulkDeleteWorkspaceFilesCommand('ws-1', 'user-1', ['a1']),
    );
  });
});
