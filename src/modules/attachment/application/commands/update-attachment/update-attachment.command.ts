export class UpdateAttachmentCommand {
  constructor(
    public readonly attachmentId: string,
    public readonly actorId: string,
  ) {}
}
