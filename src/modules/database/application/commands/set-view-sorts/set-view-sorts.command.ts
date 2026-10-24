import type { DatabaseViewSort } from '../../../domain/aggregates/view/database-view.aggregate';

export class SetViewSortsCommand {
  constructor(
    public readonly databaseId: string,
    public readonly viewId: string,
    public readonly sorts: DatabaseViewSort[],
  ) {}
}
