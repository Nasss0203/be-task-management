export class GetSlackAuthorizeUrlQuery {
  constructor(
    public readonly userId: string,
    public readonly returnTo: string,
  ) {}
}
