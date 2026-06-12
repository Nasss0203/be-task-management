import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentProvider, AttachmentStatus } from '../domain/entities/attachment.entity';
import { ATTACHMENT_TYPES } from '../interfaces/types';
import { UploadAttachmentServiceImpl } from './upload-attachment.service';

describe('UploadAttachmentServiceImpl', () => {
  let service: UploadAttachmentServiceImpl;

  const mockFileValidator = {
    validateExtension: jest.fn(),
    validateRealFileType: jest.fn(),
  };

  const mockStorageRouter = {
    uploadToCloudinary: jest.fn(),
    buildStorageKey: jest.fn(),
    uploadBuffer: jest.fn(),
  };

  const mockRepository = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadAttachmentServiceImpl,
        {
          provide: ATTACHMENT_TYPES.services.AttachmentFileValidatorService,
          useValue: mockFileValidator,
        },
        {
          provide: ATTACHMENT_TYPES.services.AttachmentStorageRouterService,
          useValue: mockStorageRouter,
        },
        {
          provide: ATTACHMENT_TYPES.repositories.UploadAttachmentRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UploadAttachmentServiceImpl>(UploadAttachmentServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    const file = { originalname: 'test.png', buffer: Buffer.from(''), size: 1024 } as any;

    it('should upload to Cloudinary if it is an image', async () => {
      mockFileValidator.validateExtension.mockReturnValue('.png');
      mockFileValidator.validateRealFileType.mockResolvedValue('image/png');
      mockStorageRouter.uploadToCloudinary.mockResolvedValue({
        publicId: 'public-id',
        url: 'http://url',
        secureUrl: 'https://secure-url',
      });
      mockRepository.save.mockResolvedValue({ id: 'att-1' });

      const result = await service.execute(file, 'ws-1', 'task-1', null, 'user-1');

      expect(mockStorageRouter.uploadToCloudinary).toHaveBeenCalledWith({
        buffer: file.buffer,
        workspaceId: 'ws-1',
        taskId: 'task-1',
        commentId: null,
        fileName: 'test.png',
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        taskId: 'task-1',
        commentId: null,
        uploadedBy: 'user-1',
        fileName: 'test.png',
        mimeType: 'image/png',
        size: 1024,
        provider: AttachmentProvider.CLOUDINARY,
        publicId: 'public-id',
        url: 'http://url',
        secureUrl: 'https://secure-url',
        status: AttachmentStatus.READY,
      });
      expect(result).toEqual({ id: 'att-1' });
    });

    it('should upload to R2 if it is not an image', async () => {
      mockFileValidator.validateExtension.mockReturnValue('.pdf');
      mockFileValidator.validateRealFileType.mockResolvedValue('application/pdf');
      mockStorageRouter.buildStorageKey.mockReturnValue('path/to/test.pdf');
      mockStorageRouter.uploadBuffer.mockResolvedValue(undefined);
      mockRepository.save.mockResolvedValue({ id: 'att-1' });

      const result = await service.execute({ ...file, originalname: 'test.pdf' }, 'ws-1', 'task-1', null, 'user-1');

      expect(mockStorageRouter.buildStorageKey).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        taskId: 'task-1',
        commentId: null,
        fileName: 'test.pdf',
      });
      expect(mockStorageRouter.uploadBuffer).toHaveBeenCalledWith({
        key: 'path/to/test.pdf',
        buffer: file.buffer,
        contentType: 'application/pdf',
        metadata: {
          uploadedBy: 'user-1',
          originalName: encodeURIComponent('test.pdf'),
        },
      });
      expect(mockRepository.save).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        taskId: 'task-1',
        commentId: null,
        uploadedBy: 'user-1',
        fileName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        provider: AttachmentProvider.R2,
        storageKey: 'path/to/test.pdf',
        status: AttachmentStatus.READY,
      });
      expect(result).toEqual({ id: 'att-1' });
    });
  });
});
