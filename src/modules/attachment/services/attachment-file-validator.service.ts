import { BadRequestException, Injectable } from '@nestjs/common';
import { extname } from 'path';
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
} from '../constants/attachment-file.constants';
import { AttachmentFileValidatorService } from '../interfaces/services/attachment-file-validator.service.interface';

@Injectable()
export class AttachmentFileValidatorServiceImpl
  implements AttachmentFileValidatorService
{
  validateExtension(fileName: string): string {
    const ext = extname(fileName).toLowerCase();

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(`File extension ${ext} is not allowed`);
    }

    return ext;
  }

  async validateRealFileType(
    file: Express.Multer.File,
    ext: string,
  ): Promise<string> {
    const { fileTypeFromBuffer } = await import('file-type');

    const detected = await fileTypeFromBuffer(file.buffer);

    if (!detected) {
      if (ext === '.txt' && file.mimetype === 'text/plain') {
        return 'text/plain';
      }

      if (
        ext === '.csv' &&
        ['text/csv', 'text/plain'].includes(file.mimetype)
      ) {
        return 'text/csv';
      }

      if (ext === '.fig' && file.mimetype === 'application/octet-stream') {
        return 'application/octet-stream';
      }

      throw new BadRequestException('Cannot detect file type');
    }

    const detectedMime = detected.mime;
    const officeExtensions = ['.docx', '.xlsx', '.pptx'];
    const isOfficeZip =
      officeExtensions.includes(ext) && detectedMime === 'application/zip';

    const isAllowedMime = ALLOWED_MIME_TYPES.includes(detectedMime);

    if (!isAllowedMime && !isOfficeZip) {
      throw new BadRequestException(`File type ${detectedMime} is not allowed`);
    }

    if (isOfficeZip) {
      if (ext === '.docx') {
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }

      if (ext === '.xlsx') {
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      }

      if (ext === '.pptx') {
        return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      }
    }

    const expectedByExt: Record<string, string[]> = {
      '.jpg': ['image/jpeg'],
      '.jpeg': ['image/jpeg'],
      '.png': ['image/png'],
      '.gif': ['image/gif'],
      '.webp': ['image/webp'],
      '.svg': ['image/svg+xml'],
      '.pdf': ['application/pdf'],
      '.zip': ['application/zip', 'application/x-zip-compressed'],
      '.doc': ['application/msword'],
      '.xls': ['application/vnd.ms-excel'],
      '.ppt': ['application/vnd.ms-powerpoint'],
    };

    const expectedMimes = expectedByExt[ext];

    if (expectedMimes && !expectedMimes.includes(detectedMime)) {
      throw new BadRequestException(
        `Invalid file content. Extension ${ext} does not match ${detectedMime}`,
      );
    }

    return detectedMime;
  }
}
