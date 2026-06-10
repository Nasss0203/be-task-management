export interface CreateAttachmentDownloadUrlApplication {
  execute(
    attachmentId: string,
    userId: string,
  ): Promise<{
    attachmentId: string;
    fileName: string;
    mimeType: string;
    size: number;
    downloadUrl: string;
    expiresIn: number;
  }>;
}
