import { Injectable } from '@nestjs/common';
import { StorageService } from 'src/shared/infrastructure/storage/storage.service';

@Injectable()
export class R2AttachmentStorageAdapter {
  constructor(private readonly storageService: StorageService) {}

  createDownloadUrl(input: {
    key: string;
    fileName: string;
    contentType?: string;
  }): Promise<{ downloadUrl: string; expiresIn: number }> {
    return this.storageService.createDownloadUrl(input);
  }
}
