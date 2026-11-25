import { BadRequestException } from '@nestjs/common';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { loadEsm } from 'load-esm';
import { tmpdir } from 'os';
import { join } from 'path';
import { AttachmentFileValidatorAdapter } from './attachment-file-validator.adapter';

jest.mock('load-esm', () => ({ loadEsm: jest.fn() }));

const mockLoadEsm = loadEsm as jest.MockedFunction<typeof loadEsm>;
const mockFileTypeFromFile = jest.fn();
const tempDir = mkdtempSync(join(tmpdir(), 'attachment-validator-'));
let fileCounter = 0;

const createFile = ({
  content = Buffer.from('hello attachment'),
  ...overrides
}: {
  content?: Buffer;
  originalName?: string;
  reportedMimeType?: string;
} = {}) => {
  const path = join(tempDir, `file-${fileCounter++}`);
  writeFileSync(path, content);

  return {
    originalName: 'test.txt',
    reportedMimeType: 'text/plain',
    size: content.length,
    path,
    ...overrides,
  };
};

describe('AttachmentFileValidatorAdapter', () => {
  const adapter = new AttachmentFileValidatorAdapter();

  beforeEach(() => {
    mockLoadEsm.mockReset();
    mockFileTypeFromFile.mockReset();
    mockLoadEsm.mockResolvedValue({
      fileTypeFromFile: mockFileTypeFromFile,
    } as unknown as typeof import('file-type'));
  });

  afterAll(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('detects the type from the uploaded file on disk', async () => {
    mockFileTypeFromFile.mockResolvedValue({ ext: 'png', mime: 'image/png' });
    const file = createFile({ originalName: 'photo.png' });

    await expect(adapter.validateRealFileType(file, '.png')).resolves.toBe(
      'image/png',
    );
    expect(mockFileTypeFromFile).toHaveBeenCalledWith(file.path);
  });

  it('accepts an empty text file', async () => {
    mockFileTypeFromFile.mockResolvedValue(undefined);

    await expect(
      adapter.validateRealFileType(
        createFile({ content: Buffer.alloc(0) }),
        '.txt',
      ),
    ).resolves.toBe('text/plain');
  });

  it('only inspects the first 4 KB of a text file', async () => {
    mockFileTypeFromFile.mockResolvedValue(undefined);
    const content = Buffer.concat([
      Buffer.alloc(4096, 'a'),
      Buffer.from([0, 1, 2]),
    ]);

    await expect(
      adapter.validateRealFileType(
        createFile({ content, originalName: 'data.csv' }),
        '.csv',
      ),
    ).resolves.toBe('text/csv');
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
    mockFileTypeFromFile.mockResolvedValue(undefined);

    await expect(
      adapter.validateRealFileType(createFile(), '.txt'),
    ).resolves.toBe('text/plain');
  });

  it('rejects disguised binary content for text files', async () => {
    mockFileTypeFromFile.mockResolvedValue(undefined);

    await expect(
      adapter.validateRealFileType(
        createFile({ content: Buffer.from([0, 1, 2, 3]) }),
        '.txt',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('maps an Office CFB file to the extension-specific MIME', async () => {
    mockFileTypeFromFile.mockResolvedValue({
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
    mockFileTypeFromFile.mockResolvedValue({
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
    mockFileTypeFromFile.mockResolvedValue(undefined);

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

  it.each([
    ['song.mp3', '.mp3', 'audio/mpeg'],
    ['voice.m4a', '.m4a', 'audio/x-m4a'],
    ['take.wav', '.wav', 'audio/wav'],
    ['clip.ogg', '.ogg', 'audio/ogg'],
    ['memo.ogg', '.ogg', 'audio/ogg; codecs=opus'],
  ])('accepts audio %s', async (originalName, extension, mime) => {
    mockFileTypeFromFile.mockResolvedValue({ ext: extension.slice(1), mime });

    expect(adapter.validateExtension(originalName)).toBe(extension);
    await expect(
      adapter.validateRealFileType(createFile({ originalName }), extension),
    ).resolves.toBe(mime);
  });

  it('rejects an executable renamed to .mp3', async () => {
    mockFileTypeFromFile.mockResolvedValue({
      ext: 'exe',
      mime: 'application/x-msdownload',
    });

    await expect(
      adapter.validateRealFileType(
        createFile({ originalName: 'song.mp3' }),
        '.mp3',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a video saved with an .mp3 extension', async () => {
    mockFileTypeFromFile.mockResolvedValue({ ext: 'mp4', mime: 'video/mp4' });

    await expect(
      adapter.validateRealFileType(
        createFile({ originalName: 'song.mp3' }),
        '.mp3',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects content that does not match its extension', async () => {
    mockFileTypeFromFile.mockResolvedValue({
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
