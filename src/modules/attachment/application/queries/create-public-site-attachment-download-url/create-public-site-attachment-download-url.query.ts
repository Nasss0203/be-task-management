export class CreatePublicSiteAttachmentDownloadUrlQuery {
  constructor(
    public readonly subdomain: string,
    public readonly path: string,
    public readonly attachmentId: string,
  ) {}
}
