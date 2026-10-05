export type UploadObjectInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

export type StoredObject = {
  key: string;
  contentType: string;
  size: number;
};

export interface ObjectStoragePort {
  upload(input: UploadObjectInput): Promise<StoredObject>;

  delete(key: string): Promise<void>;

  getSignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
