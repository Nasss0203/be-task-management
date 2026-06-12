import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentController } from './attachment.controller';
import { ATTACHMENT_TYPES } from '../interfaces/types';

describe('AttachmentController', () => {
  let controller: AttachmentController;

  const mockUploadApp = { execute: jest.fn() };
  const mockFindApp = { findByTask: jest.fn() };
  const mockCreateDownloadUrlApp = { execute: jest.fn() };
  const mockUpdateApp = { execute: jest.fn() };
  const mockDeleteApp = { execute: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttachmentController],
      providers: [
        { provide: ATTACHMENT_TYPES.applications.UploadAttachmentApplication, useValue: mockUploadApp },
        { provide: ATTACHMENT_TYPES.applications.FindAttachmentApplication, useValue: mockFindApp },
        { provide: ATTACHMENT_TYPES.applications.CreateAttachmentDownloadUrlApplication, useValue: mockCreateDownloadUrlApp },
        { provide: ATTACHMENT_TYPES.applications.UpdateAttachmentApplication, useValue: mockUpdateApp },
        { provide: ATTACHMENT_TYPES.applications.DeleteAttachmentApplication, useValue: mockDeleteApp },
      ],
    }).compile();

    controller = module.get<AttachmentController>(AttachmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('upload', () => {
    it('should call uploadApp', async () => {
      mockUploadApp.execute.mockResolvedValue({ id: 'att-1' });
      const file = { originalname: 'test.png' } as any;
      const body = { taskId: 'task-1' };
      const auth = { id: 'user-1' } as any;

      const result = await controller.upload('ws-1', body, file, auth);

      expect(mockUploadApp.execute).toHaveBeenCalledWith(file, { taskId: 'task-1', workspaceId: 'ws-1' }, 'user-1');
      expect(result).toEqual({ id: 'att-1' });
    });
  });

  describe('findByTask', () => {
    it('should call findApp', async () => {
      mockFindApp.findByTask.mockResolvedValue([{ id: 'att-1' }]);

      const result = await controller.findByTask('task-1');

      expect(mockFindApp.findByTask).toHaveBeenCalledWith('task-1');
      expect(result).toEqual([{ id: 'att-1' }]);
    });
  });

  describe('createDownloadUrl', () => {
    it('should call createDownloadUrlApp', async () => {
      mockCreateDownloadUrlApp.execute.mockResolvedValue({ downloadUrl: 'http://url' });
      const auth = { id: 'user-1' } as any;

      const result = await controller.createDownloadUrl('att-1', auth);

      expect(mockCreateDownloadUrlApp.execute).toHaveBeenCalledWith('att-1', 'user-1');
      expect(result).toEqual({ downloadUrl: 'http://url' });
    });
  });

  describe('update', () => {
    it('should call updateApp', async () => {
      mockUpdateApp.execute.mockResolvedValue({ id: 'att-1' });
      const body = { fileName: 'new.png' };
      const auth = { id: 'user-1' } as any;

      const result = await controller.update('att-1', body, auth);

      expect(mockUpdateApp.execute).toHaveBeenCalledWith('att-1', body, 'user-1');
      expect(result).toEqual({ id: 'att-1' });
    });
  });

  describe('delete', () => {
    it('should call deleteApp', async () => {
      mockDeleteApp.execute.mockResolvedValue(undefined);
      const auth = { id: 'user-1' } as any;

      const result = await controller.delete('att-1', auth);

      expect(mockDeleteApp.execute).toHaveBeenCalledWith('att-1', 'user-1');
      expect(result).toBeUndefined();
    });
  });
});
