export interface CreateAttachmentDownloadUrlService {
  execute(attachmentId: string): Promise<{
    attachmentId: string;
    fileName: string;
    mimeType: string;
    size: number;
    downloadUrl: string;
    expiresIn: number;
  }>;
}
