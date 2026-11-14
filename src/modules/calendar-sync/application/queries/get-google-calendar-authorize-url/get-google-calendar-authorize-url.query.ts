export class GetGoogleCalendarAuthorizeUrlQuery {
  constructor(
    public readonly userId: string,
    public readonly returnTo: string,
  ) {}
}
