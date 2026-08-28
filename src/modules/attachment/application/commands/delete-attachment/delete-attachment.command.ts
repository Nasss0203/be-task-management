export class DeleteAttachmentCommand {
  constructor(
    public readonly attachmentId: string,
    public readonly actorId: string,
  ) {}
}
