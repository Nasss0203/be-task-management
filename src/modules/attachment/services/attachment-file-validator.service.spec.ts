import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { loadEsm } from 'load-esm';
import { AttachmentFileValidatorServiceImpl } from './attachment-file-validator.service';

jest.mock('load-esm', () => ({
  loadEsm: jest.fn(),
}));

const mockLoadEsm = loadEsm as jest.MockedFunction<typeof loadEsm>;
const mockFileTypeFromBuffer = jest.fn();

const createCompoundFileBuffer = () => {
  const buffer = Buffer.alloc(512);
  Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]).copy(buffer);
  return buffer;
};

describe('AttachmentFileValidatorServiceImpl', () => {
  let service: AttachmentFileValidatorServiceImpl;

  beforeEach(async () => {
    mockLoadEsm.mockReset();
    mockFileTypeFromBuffer.mockReset();
    mockLoadEsm.mockResolvedValue({
      fileTypeFromBuffer: mockFileTypeFromBuffer,
    } as unknown as typeof import('file-type'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [AttachmentFileValidatorServiceImpl],
    }).compile();

    service = module.get<AttachmentFileValidatorServiceImpl>(
      AttachmentFileValidatorServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateExtension', () => {
    it('should return extension if allowed', () => {
      const ext = service.validateExtension('test.png');
      expect(ext).toEqual('.png');
    });

    it('should throw BadRequestException if not allowed', () => {
      expect(() => service.validateExtension('test.exe')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateRealFileType', () => {
    it('should accept plain text files without a detected binary signature', async () => {
      mockFileTypeFromBuffer.mockResolvedValue(undefined);

      await expect(
        service.validateRealFileType(
          {
            buffer: Buffer.from('hello task attachment'),
            mimetype: 'text/plain',
          } as Express.Multer.File,
          '.txt',
        ),
      ).resolves.toBe('text/plain');
    });

    it('should reject disguised binary content for text files', async () => {
      mockFileTypeFromBuffer.mockResolvedValue(undefined);

      await expect(
        service.validateRealFileType(
          {
            buffer: Buffer.from([0, 1, 2, 3]),
            mimetype: 'text/plain',
          } as Express.Multer.File,
          '.txt',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should map old Microsoft Word CFB files to application/msword', async () => {
      mockFileTypeFromBuffer.mockResolvedValue({
        ext: 'cfb',
        mime: 'application/x-cfb',
      });

      await expect(
        service.validateRealFileType(
          {
            buffer: createCompoundFileBuffer(),
            mimetype: 'application/msword',
          } as Express.Multer.File,
          '.doc',
        ),
      ).resolves.toBe('application/msword');
    });
  });
});
