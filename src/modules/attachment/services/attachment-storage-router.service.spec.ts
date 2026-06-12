import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from '../../storage/storage.service';
import { AttachmentStorageRouterServiceImpl } from './attachment-storage-router.service';

describe('AttachmentStorageRouterServiceImpl', () => {
  let service: AttachmentStorageRouterServiceImpl;

  const mockStorageService = {
    buildStorageKey: jest.fn(),
    uploadBuffer: jest.fn(),
    createDownloadUrl: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('mocked-value'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentStorageRouterServiceImpl,
        { provide: StorageService, useValue: mockStorageService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AttachmentStorageRouterServiceImpl>(
      AttachmentStorageRouterServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildStorageKey', () => {
    it('should call storageService.buildStorageKey', () => {
      mockStorageService.buildStorageKey.mockReturnValue('path/to/file.png');
      const params = { workspaceId: 'ws-1', fileName: 'file.png' };

      const result = service.buildStorageKey(params);

      expect(mockStorageService.buildStorageKey).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        taskId: undefined,
        commentId: undefined,
        fileName: 'file.png',
      });
      expect(result).toEqual('path/to/file.png');
    });
  });

  describe('uploadBuffer', () => {
    it('should call storageService.uploadBuffer', async () => {
      const params = { key: 'key', buffer: Buffer.from(''), contentType: 'image/png' };

      await service.uploadBuffer(params);

      expect(mockStorageService.uploadBuffer).toHaveBeenCalledWith(params);
    });
  });

  describe('createDownloadUrl', () => {
    it('should call storageService.createDownloadUrl', async () => {
      const params = { key: 'key', fileName: 'file.png' };
      mockStorageService.createDownloadUrl.mockResolvedValue({ downloadUrl: 'url', expiresIn: 3600 });

      const result = await service.createDownloadUrl(params);

      expect(mockStorageService.createDownloadUrl).toHaveBeenCalledWith(params);
      expect(result).toEqual({ downloadUrl: 'url', expiresIn: 3600 });
    });
  });
});
