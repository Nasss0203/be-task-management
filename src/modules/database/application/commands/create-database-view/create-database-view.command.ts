import { DatabaseViewType } from '../../../domain/enums/database-view-type.enum';

export class CreateDatabaseViewCommand {
  constructor(
    public readonly databaseId: string,
    public readonly name: string,
    public readonly type: DatabaseViewType,
  ) {}
}
