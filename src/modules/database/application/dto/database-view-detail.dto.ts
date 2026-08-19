import { DatabaseView } from '../../domain/aggregates/view/database-view.aggregate';
import { DatabaseViewType } from '../../domain/enums/database-view-type.enum';
import { DatabaseViewPropertyDto } from './database-view-property.dto';

export class DatabaseViewDetailDto {
  id: string;
  databaseId: string;
  name: string;
  type: DatabaseViewType;
  position: string;
  properties: DatabaseViewPropertyDto[];

  static fromDomain(view: DatabaseView): DatabaseViewDetailDto {
    const properties = [...view.getProperties()]
      .sort((a, b) => Number(a.getPosition()) - Number(b.getPosition()))
      .map(DatabaseViewPropertyDto.fromDomain);

    return {
      id: view.getId(),
      databaseId: view.getDatabaseId(),
      name: view.getName(),
      type: view.getType(),
      position: view.getPosition(),
      properties,
    };
  }
}
