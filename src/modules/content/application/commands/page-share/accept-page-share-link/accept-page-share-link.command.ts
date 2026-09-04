export class AcceptPageShareLinkCommand {
  constructor(
    public readonly userId: string,
    public readonly token: string,
  ) {}
}
