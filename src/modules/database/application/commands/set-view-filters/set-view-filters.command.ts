import type { DatabaseViewFilter } from '../../../domain/constants/database-view-filter.constant';

export class SetViewFiltersCommand {
  constructor(
    public readonly databaseId: string,
    public readonly viewId: string,
    public readonly filters: DatabaseViewFilter[],
  ) {}
}
