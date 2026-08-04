import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ActivityAction,
  ActivityEntityType,
} from '../../activity/domain/entities/activity.entity';
import { ACTIVITY_TYPES } from '../../activity/interfaces/types';
import { ATTACHMENT_TYPES } from '../interfaces/types';
import { AttachmentMapper } from '../mapper/attachment.mapper';
import { UploadAttachmentApplicationImpl } from './upload-attachment.application';

describe('UploadAttachmentApplicationImpl', () => {
  let app: UploadAttachmentApplicationImpl;

  const mockUploadAttachmentService = { execute: jest.fn() };
  const mockCreateActivityService = { create: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadAttachmentApplicationImpl,
        {
          provide: ATTACHMENT_TYPES.services.UploadAttachmentService,
          useValue: mockUploadAttachmentService,
        },
        {
          provide: ACTIVITY_TYPES.services.CreateActivityService,
          useValue: mockCreateActivityService,
        },
      ],
    }).compile();

    app = module.get<UploadAttachmentApplicationImpl>(
      UploadAttachmentApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('execute', () => {
    const file = { originalname: 'test.png' } as any;

    it('should throw BadRequestException if neither taskId nor commentId is provided', async () => {
      await expect(
        app.execute(file, { workspaceId: 'ws-1' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should call uploadService and create activity if taskId is provided', async () => {
      const mockSaved = {
        id: 'att-1',
        workspaceId: 'ws-1',
        taskId: 'task-1',
        commentId: null,
        fileName: 'test.png',
        mimeType: 'image/png',
        size: 1024,
      };
      mockUploadAttachmentService.execute.mockResolvedValue(mockSaved);

      const originalMapper = AttachmentMapper.toResponse;
      AttachmentMapper.toResponse = jest.fn().mockReturnValue({ mapped: true });

      const result = await app.execute(
        file,
        { workspaceId: 'ws-1', taskId: 'task-1' },
        'user-1',
      );

      expect(mockUploadAttachmentService.execute).toHaveBeenCalledWith(
        file,
        'ws-1',
        'task-1',
        null,
        'user-1',
      );
      expect(mockCreateActivityService.create).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        entityType: ActivityEntityType.ATTACHMENT,
        entityId: 'att-1',
        actorId: 'user-1',
        action: ActivityAction.ATTACHMENT_UPLOADED,
        metadata: {
          taskId: 'task-1',
          commentId: null,
          fileName: 'test.png',
          mimeType: 'image/png',
          size: 1024,
        },
      });
      expect(result).toEqual({ mapped: true });

      AttachmentMapper.toResponse = originalMapper;
    });

    it('should call uploadService and create activity if commentId is provided', async () => {
      const mockSaved = {
        id: 'att-1',
        workspaceId: 'ws-1',
        taskId: null,
        commentId: 'comment-1',
        fileName: 'test.png',
        mimeType: 'image/png',
        size: 1024,
      };
      mockUploadAttachmentService.execute.mockResolvedValue(mockSaved);

      const originalMapper = AttachmentMapper.toResponse;
      AttachmentMapper.toResponse = jest.fn().mockReturnValue({ mapped: true });

      const result = await app.execute(
        file,
        { workspaceId: 'ws-1', commentId: 'comment-1' },
        'user-1',
      );

      expect(mockUploadAttachmentService.execute).toHaveBeenCalledWith(
        file,
        'ws-1',
        null,
        'comment-1',
        'user-1',
      );
      expect(result).toEqual({ mapped: true });

      AttachmentMapper.toResponse = originalMapper;
    });
  });
});
