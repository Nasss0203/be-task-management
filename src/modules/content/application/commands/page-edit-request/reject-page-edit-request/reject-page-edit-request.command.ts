export class RejectPageEditRequestCommand {
  constructor(
    public readonly userId: string,
    public readonly requestId: string,
  ) {}
}
