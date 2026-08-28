import { BadRequestException, Injectable } from '@nestjs/common';
import { loadEsm } from 'load-esm';
import { extname } from 'path';
import { pathToFileURL } from 'url';
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
} from '../../application/constants/attachment-file.constants';
import type {
  AttachmentFileInput,
  AttachmentFileValidatorPort,
} from '../../application/ports/attachment-file-validator.port';

const OFFICE_OPEN_XML_MIME_BY_EXTENSION: Record<string, string> = {
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx':
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

const OFFICE_BINARY_MIME_BY_EXTENSION: Record<string, string> = {
  '.doc': 'application/msword',
  '.xls': 'application/vnd.ms-excel',
  '.ppt': 'application/vnd.ms-powerpoint',
};

type FileTypeModule = typeof import('file-type');

@Injectable()
export class AttachmentFileValidatorAdapter implements AttachmentFileValidatorPort {
  private async loadFileTypeModule(): Promise<FileTypeModule> {
    try {
      return await loadEsm<FileTypeModule>(
        pathToFileURL(require.resolve('file-type')).href,
      );
    } catch {
      return await loadEsm<FileTypeModule>('file-type');
    }
  }

  private isLikelyTextBuffer(buffer: Buffer): boolean {
    if (buffer.length === 0) return true;

    const sample = buffer.subarray(0, Math.min(buffer.length, 4096));

    return sample.every(
      (byte) => byte === 9 || byte === 10 || byte === 13 || byte >= 32,
    );
  }

  validateExtension(fileName: string): string {
    const extension = extname(fileName).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      throw new BadRequestException(
        `File extension ${extension} is not allowed`,
      );
    }

    return extension;
  }

  async validateRealFileType(
    file: AttachmentFileInput,
    extension: string,
  ): Promise<string> {
    const { fileTypeFromBuffer } = await this.loadFileTypeModule();
    const detected = await fileTypeFromBuffer(file.buffer);

    if (!detected) {
      if (
        extension === '.txt' &&
        ['text/plain', 'application/octet-stream'].includes(
          file.reportedMimeType,
        ) &&
        this.isLikelyTextBuffer(file.buffer)
      ) {
        return 'text/plain';
      }

      if (
        extension === '.csv' &&
        ['text/csv', 'text/plain', 'application/octet-stream'].includes(
          file.reportedMimeType,
        ) &&
        this.isLikelyTextBuffer(file.buffer)
      ) {
        return 'text/csv';
      }

      if (
        extension === '.fig' &&
        file.reportedMimeType === 'application/octet-stream'
      ) {
        return 'application/octet-stream';
      }

      throw new BadRequestException('Cannot detect file type');
    }

    const detectedMime = detected.mime;
    const officeOpenXmlMime = OFFICE_OPEN_XML_MIME_BY_EXTENSION[extension];
    const isOfficeZip = Boolean(
      officeOpenXmlMime && detectedMime === 'application/zip',
    );
    const officeBinaryMime = OFFICE_BINARY_MIME_BY_EXTENSION[extension];
    const isOfficeBinary = Boolean(
      officeBinaryMime && detectedMime === 'application/x-cfb',
    );
    const isAllowedMime = ALLOWED_MIME_TYPES.includes(detectedMime);

    if (!isAllowedMime && !isOfficeZip && !isOfficeBinary) {
      throw new BadRequestException(`File type ${detectedMime} is not allowed`);
    }

    if (isOfficeZip) return officeOpenXmlMime;
    if (isOfficeBinary) return officeBinaryMime;

    const expectedByExtension: Record<string, string[]> = {
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png'],
      '.gif': ['image/gif'],
      '.webp': ['image/webp'],
      '.svg': ['image/svg+xml'],
      '.pdf': ['application/pdf'],
      '.zip': ['application/zip', 'application/x-zip-compressed'],
      '.doc': ['application/msword', 'application/x-cfb'],
      '.xls': ['application/vnd.ms-excel', 'application/x-cfb'],
      '.ppt': ['application/vnd.ms-powerpoint', 'application/x-cfb'],
    };

    const expectedMimes = expectedByExtension[extension];

    if (expectedMimes && !expectedMimes.includes(detectedMime)) {
      throw new BadRequestException(
        `Invalid file content. Extension ${extension} does not match ${detectedMime}`,
      );
    }

    return detectedMime;
  }
}
