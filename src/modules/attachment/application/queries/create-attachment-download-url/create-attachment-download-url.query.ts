export class CreateAttachmentDownloadUrlQuery {
  constructor(
    public readonly attachmentId: string,
    public readonly actorId: string,
  ) {}
}
