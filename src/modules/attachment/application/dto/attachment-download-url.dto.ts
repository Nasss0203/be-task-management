export class AttachmentDownloadUrlDto {
  constructor(
    public readonly attachmentId: string,
    public readonly fileName: string,
    public readonly mimeType: string,
    public readonly size: number,
    public readonly downloadUrl: string,
    public readonly expiresIn: number,
  ) {}
}
