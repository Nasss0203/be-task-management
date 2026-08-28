import { BadRequestException } from '@nestjs/common';
import { loadEsm } from 'load-esm';
import { AttachmentFileValidatorAdapter } from './attachment-file-validator.adapter';

jest.mock('load-esm', () => ({ loadEsm: jest.fn() }));

const mockLoadEsm = loadEsm as jest.MockedFunction<typeof loadEsm>;
const mockFileTypeFromBuffer = jest.fn();

const createFile = (overrides: Partial<Record<string, unknown>> = {}) => ({
  originalName: 'test.txt',
  reportedMimeType: 'text/plain',
  size: 10,
  buffer: Buffer.from('hello attachment'),
  ...overrides,
});

describe('AttachmentFileValidatorAdapter', () => {
  const adapter = new AttachmentFileValidatorAdapter();

  beforeEach(() => {
    mockLoadEsm.mockReset();
    mockFileTypeFromBuffer.mockReset();
    mockLoadEsm.mockResolvedValue({
      fileTypeFromBuffer: mockFileTypeFromBuffer,
    } as unknown as typeof import('file-type'));
  });

  it('returns an allowed lowercase extension', () => {
    expect(adapter.validateExtension('TEST.PNG')).toBe('.png');
  });

  it('rejects a disallowed extension', () => {
    expect(() => adapter.validateExtension('test.exe')).toThrow(
      BadRequestException,
    );
  });

  it('accepts plain text without a binary signature', async () => {
    mockFileTypeFromBuffer.mockResolvedValue(undefined);

    await expect(
      adapter.validateRealFileType(createFile(), '.txt'),
    ).resolves.toBe('text/plain');
  });

  it('rejects disguised binary content for text files', async () => {
    mockFileTypeFromBuffer.mockResolvedValue(undefined);

    await expect(
      adapter.validateRealFileType(
        createFile({ buffer: Buffer.from([0, 1, 2, 3]) }),
        '.txt',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('maps an Office CFB file to the extension-specific MIME', async () => {
    mockFileTypeFromBuffer.mockResolvedValue({
      ext: 'cfb',
      mime: 'application/x-cfb',
    });

    await expect(
      adapter.validateRealFileType(
        createFile({
          originalName: 'test.doc',
          reportedMimeType: 'application/msword',
        }),
        '.doc',
      ),
    ).resolves.toBe('application/msword');
  });

  it('maps an Office Open XML ZIP to the extension-specific MIME', async () => {
    mockFileTypeFromBuffer.mockResolvedValue({
      ext: 'zip',
      mime: 'application/zip',
    });

    await expect(
      adapter.validateRealFileType(
        createFile({ originalName: 'test.docx' }),
        '.docx',
      ),
    ).resolves.toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('accepts FIG when reported as octet-stream and undetected', async () => {
    mockFileTypeFromBuffer.mockResolvedValue(undefined);

    await expect(
      adapter.validateRealFileType(
        createFile({
          originalName: 'design.fig',
          reportedMimeType: 'application/octet-stream',
        }),
        '.fig',
      ),
    ).resolves.toBe('application/octet-stream');
  });

  it('rejects content that does not match its extension', async () => {
    mockFileTypeFromBuffer.mockResolvedValue({
      ext: 'pdf',
      mime: 'application/pdf',
    });

    await expect(
      adapter.validateRealFileType(
        createFile({ originalName: 'fake.png' }),
        '.png',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
