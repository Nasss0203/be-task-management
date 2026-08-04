type AttachmentDownloadUrlDto = {
  attachmentId: string;
  fileName: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  expiresIn: number;
};

export interface CreateAttachmentDownloadUrlApplication {
  execute(
    attachmentId: string,
    userId: string,
  ): Promise<AttachmentDownloadUrlDto>;
}
