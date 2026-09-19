export class RejectPageShareLinkCommand {
  constructor(
    public readonly userId: string,
    public readonly token: string,
  ) {}
}
