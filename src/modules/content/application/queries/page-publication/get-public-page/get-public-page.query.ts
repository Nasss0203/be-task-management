export class GetPublicPageQuery {
  constructor(
    public readonly subdomain: string,
    public readonly path: string,
  ) {}
}
