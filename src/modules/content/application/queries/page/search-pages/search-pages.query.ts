import type { PageSearchFilters } from '../../../ports/page-search-reader.port';

export class SearchPagesQuery {
  constructor(
    public readonly workspaceId: string,
    public readonly userId: string,
    public readonly query: string,
    public readonly filters: PageSearchFilters = {},
  ) {}
}
