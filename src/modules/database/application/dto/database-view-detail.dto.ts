import {
  DatabaseView,
  type DatabaseViewSort,
} from '../../domain/aggregates/view/database-view.aggregate';
import type { DatabaseViewFilter } from '../../domain/constants/database-view-filter.constant';
import { DatabaseViewType } from '../../domain/enums/database-view-type.enum';
import { DatabaseViewPropertyDto } from './database-view-property.dto';

export class DatabaseViewDetailDto {
  id: string;
  databaseId: string;
  name: string;
  type: DatabaseViewType;
  position: string;
  properties: DatabaseViewPropertyDto[];
  sorts: DatabaseViewSort[];
  filters: DatabaseViewFilter[];

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
      sorts: [...view.getSorts()],
      filters: [...view.getFilters()],
    };
  }
}
