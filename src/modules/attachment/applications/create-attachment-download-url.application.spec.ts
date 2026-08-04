import { Test, TestingModule } from '@nestjs/testing';
import { ATTACHMENT_TYPES } from '../interfaces/types';
import { CreateAttachmentDownloadUrlApplicationImpl } from './create-attachment-download-url.application';

describe('CreateAttachmentDownloadUrlApplicationImpl', () => {
  let app: CreateAttachmentDownloadUrlApplicationImpl;

  const mockCreateAttachmentDownloadUrlService = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAttachmentDownloadUrlApplicationImpl,
        {
          provide: ATTACHMENT_TYPES.services.CreateAttachmentDownloadUrlService,
          useValue: mockCreateAttachmentDownloadUrlService,
        },
      ],
    }).compile();

    app = module.get<CreateAttachmentDownloadUrlApplicationImpl>(
      CreateAttachmentDownloadUrlApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  describe('execute', () => {
    it('should call downloadService.execute and return the result', async () => {
      const mockResult = {
        attachmentId: 'att-1',
        fileName: 'test.png',
        mimeType: 'image/png',
        size: 1024,
        downloadUrl: 'http://example.com/download',
        expiresIn: 3600,
      };
      mockCreateAttachmentDownloadUrlService.execute.mockResolvedValue(
        mockResult,
      );

      const result = await app.execute('att-1', 'user-1');

      expect(
        mockCreateAttachmentDownloadUrlService.execute,
      ).toHaveBeenCalledWith('att-1');
      expect(result).toEqual(mockResult);
    });
  });
});
