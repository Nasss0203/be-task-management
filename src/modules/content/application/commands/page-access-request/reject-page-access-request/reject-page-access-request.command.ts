export class RejectPageAccessRequestCommand {
  constructor(
    public readonly reviewerId: string,
    public readonly requestId: string,
  ) {}
}
