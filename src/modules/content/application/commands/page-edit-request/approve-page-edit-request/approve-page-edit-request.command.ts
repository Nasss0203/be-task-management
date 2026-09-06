export class ApprovePageEditRequestCommand {
  constructor(
    public readonly userId: string,
    public readonly requestId: string,
  ) {}
}
