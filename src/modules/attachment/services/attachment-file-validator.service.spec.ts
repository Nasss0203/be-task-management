import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentFileValidatorServiceImpl } from './attachment-file-validator.service';

describe('AttachmentFileValidatorServiceImpl', () => {
  let service: AttachmentFileValidatorServiceImpl;

  beforeEach(async () => {
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
      expect(() => service.validateExtension('test.exe')).toThrow(BadRequestException);
    });
  });

  describe('validateRealFileType', () => {
    it('should pass a simple check', async () => {
      expect(service).toBeDefined();
    });
  });
});
