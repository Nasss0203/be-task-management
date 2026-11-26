import type { Readable } from 'stream';

export type UploadObjectInput = {
  key: string;
  contentType: string;
} & ({ body: Buffer } | { body: Readable; contentLength: number });

export type StoredObject = {
  key: string;
  contentType: string;
  size: number;
};

export type SignedDownloadOptions = {
  fileName?: string;
  contentType?: string;
};

export interface ObjectStoragePort {
  upload(input: UploadObjectInput): Promise<StoredObject>;

  delete(key: string): Promise<void>;

  getSignedDownloadUrl(
    key: string,
    expiresInSeconds?: number,
    options?: SignedDownloadOptions,
  ): Promise<string>;
}
