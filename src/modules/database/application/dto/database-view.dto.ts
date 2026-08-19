import { DatabaseView } from '../../domain/aggregates/view/database-view.aggregate';
import { DatabaseViewType } from '../../domain/enums/database-view-type.enum';

export class DatabaseViewDto {
  id: string;
  databaseId: string;
  name: string;
  type: DatabaseViewType;
  position: string;

  static fromDomain(view: DatabaseView): DatabaseViewDto {
    return {
      id: view.getId(),
      databaseId: view.getDatabaseId(),
      name: view.getName(),
      type: view.getType(),
      position: view.getPosition(),
    };
  }
}
