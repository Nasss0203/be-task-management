import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentProvider } from '../domain/entities/attachment.entity';
import { ATTACHMENT_TYPES } from '../interfaces/types';
import { CreateAttachmentDownloadUrlServiceImpl } from './create-attachment-download-url.service';

describe('CreateAttachmentDownloadUrlServiceImpl', () => {
  let service: CreateAttachmentDownloadUrlServiceImpl;

  const mockFindRepository = {
    findReadyById: jest.fn(),
  };

  const mockStorageRouter = {
    createDownloadUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAttachmentDownloadUrlServiceImpl,
        {
          provide: ATTACHMENT_TYPES.repositories.FindAttachmentRepository,
          useValue: mockFindRepository,
        },
        {
          provide: ATTACHMENT_TYPES.services.AttachmentStorageRouterService,
          useValue: mockStorageRouter,
        },
      ],
    }).compile();

    service = module.get<CreateAttachmentDownloadUrlServiceImpl>(
      CreateAttachmentDownloadUrlServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('execute', () => {
    it('should throw NotFoundException if attachment not found', async () => {
      mockFindRepository.findReadyById.mockResolvedValue(null);

      await expect(service.execute('att-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if Cloudinary URL not found', async () => {
      mockFindRepository.findReadyById.mockResolvedValue({
        provider: AttachmentProvider.CLOUDINARY,
      });

      await expect(service.execute('att-1')).rejects.toThrow(NotFoundException);
    });

    it('should return Cloudinary URL if provider is CLOUDINARY', async () => {
      mockFindRepository.findReadyById.mockResolvedValue({
        id: 'att-1',
        fileName: 'test.png',
        mimeType: 'image/png',
        size: 1024,
        provider: AttachmentProvider.CLOUDINARY,
        secureUrl: 'http://cloudinary',
      });

      const result = await service.execute('att-1');

      expect(result).toEqual({
        attachmentId: 'att-1',
        fileName: 'test.png',
        mimeType: 'image/png',
        size: 1024,
        downloadUrl: 'http://cloudinary',
        expiresIn: 31536000,
      });
    });

    it('should throw NotFoundException if storage key not found', async () => {
      mockFindRepository.findReadyById.mockResolvedValue({
        provider: AttachmentProvider.S3,
      });

      await expect(service.execute('att-1')).rejects.toThrow(NotFoundException);
    });

    it('should return storage router URL if provider is S3', async () => {
      mockFindRepository.findReadyById.mockResolvedValue({
        id: 'att-1',
        fileName: 'test.png',
        mimeType: 'image/png',
        size: 1024,
        provider: AttachmentProvider.S3,
        storageKey: 'key',
      });
      mockStorageRouter.createDownloadUrl.mockResolvedValue({
        downloadUrl: 'http://s3',
        expiresIn: 3600,
      });

      const result = await service.execute('att-1');

      expect(result).toEqual({
        attachmentId: 'att-1',
        fileName: 'test.png',
        mimeType: 'image/png',
        size: 1024,
        downloadUrl: 'http://s3',
        expiresIn: 3600,
      });
    });
  });
});
