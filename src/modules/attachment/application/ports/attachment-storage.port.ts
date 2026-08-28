import { AttachmentProvider } from '../../domain/enums/attachment-provider.enum';

export type UploadAttachmentStorageInput = {
  buffer: Buffer;
  workspaceId: string;
  taskId: string | null;
  commentId: string | null;
  pageBlockId: string | null;
  fileName: string;
  mimeType: string;
  uploadedBy: string;
};

export type AttachmentStorageUploadResult = {
  provider: AttachmentProvider;
  storageKey: string | null;
  publicId: string | null;
  url: string | null;
  secureUrl: string | null;
};

export interface AttachmentStoragePort {
  upload(
    input: UploadAttachmentStorageInput,
  ): Promise<AttachmentStorageUploadResult>;

  createDownloadUrl(input: {
    key: string;
    fileName: string;
  }): Promise<{ downloadUrl: string; expiresIn: number }>;
}
