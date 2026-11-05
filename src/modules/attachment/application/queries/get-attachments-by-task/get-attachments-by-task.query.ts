export class GetAttachmentsByTaskQuery {
  constructor(
    public readonly taskId: string,
    public readonly actorId: string,
  ) {}
}
