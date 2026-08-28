import type { AttachmentFileInput } from '../../ports/attachment-file-validator.port';

export class UploadAttachmentCommand {
  constructor(
    public readonly file: AttachmentFileInput,
    public readonly workspaceId: string,
    public readonly taskId: string | null,
    public readonly commentId: string | null,
    public readonly pageBlockId: string | null,
    public readonly actorId: string,
  ) {}
}
