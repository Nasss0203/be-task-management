import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { ConfigService } from '@nestjs/config';
import { R2_CLIENT } from './constant/r2.constants';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn(),
    })),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
    GetObjectCommand: jest.fn(),
  };
});

describe('StorageService', () => {
  let service: StorageService;
  let s3Client: jest.Mocked<S3Client>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockS3Client = { send: jest.fn() };
    const mockConfigService = { getOrThrow: jest.fn().mockReturnValue('test-bucket') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: R2_CLIENT, useValue: mockS3Client },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
    s3Client = module.get(R2_CLIENT);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should upload buffer', async () => {
    s3Client.send.mockResolvedValueOnce({} as never);
    const result = await service.uploadBuffer({
      key: 'test-key',
      buffer: Buffer.from('test'),
      contentType: 'text/plain',
      metadata: { meta: 'data' },
    });
    expect(s3Client.send).toHaveBeenCalled();
    expect(result.key).toEqual('test-key');
  });

  it('should create download url', async () => {
    (getSignedUrl as jest.Mock).mockResolvedValue('http://test-url.com');
    const result = await service.createDownloadUrl({
      key: 'test-key',
      fileName: 'test.txt',
      contentType: 'text/plain',
      expiresIn: 300,
    });
    expect(getSignedUrl).toHaveBeenCalled();
    expect(result.downloadUrl).toEqual('http://test-url.com');
  });

  it('should create download url without filename', async () => {
    (getSignedUrl as jest.Mock).mockResolvedValue('http://test-url.com');
    const result = await service.createDownloadUrl({
      key: 'test-key',
    });
    expect(getSignedUrl).toHaveBeenCalled();
    expect(result.downloadUrl).toEqual('http://test-url.com');
  });

  it('should delete file', async () => {
    s3Client.send.mockResolvedValueOnce({} as never);
    const result = await service.deleteFile('test-key');
    expect(s3Client.send).toHaveBeenCalled();
    expect(result.deleted).toEqual(true);
    expect(result.key).toEqual('test-key');
  });

  it('should build storage key with task id', () => {
    const result = service.buildStorageKey({ workspaceId: 'ws-1', taskId: 't-1', fileName: 'test.txt' });
    expect(result).toContain('workspaces/ws-1/tasks/t-1/');
    expect(result).toContain('test.txt');
  });

  it('should build storage key with comment id', () => {
    const result = service.buildStorageKey({ workspaceId: 'ws-1', commentId: 'c-1', fileName: 'test.txt' });
    expect(result).toContain('workspaces/ws-1/comments/c-1/');
    expect(result).toContain('test.txt');
  });

  it('should build storage key without task or comment id', () => {
    const result = service.buildStorageKey({ workspaceId: 'ws-1', fileName: 'test.txt' });
    expect(result).toContain('workspaces/ws-1/files/');
    expect(result).toContain('test.txt');
  });
});
