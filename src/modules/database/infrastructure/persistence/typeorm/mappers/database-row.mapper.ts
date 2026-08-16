import { DatabaseRow } from '../../../../domain/aggregates/row/database-row.aggregate';
import { RowValue } from '../../../../domain/aggregates/row/row-value.entity';

import { DatabaseRowOrmEntity } from '../entities/database-row.orm-entity';
import { RowValueOrmEntity } from '../entities/row-value.orm-entity';

export class DatabaseRowMapper {
  static toOrm(domain: DatabaseRow): DatabaseRowOrmEntity {
    const orm = new DatabaseRowOrmEntity();

    orm.id = domain.getId();
    orm.databaseId = domain.getDatabaseId();

    orm.values = domain.getValues().map((value) => {
      const valueOrm = this.valueToOrm(value);

      valueOrm.row = orm;

      return valueOrm;
    });

    return orm;
  }

  static toDomain(orm: DatabaseRowOrmEntity): DatabaseRow {
    const values = (orm.values ?? []).map((value) => this.valueToDomain(value));

    return DatabaseRow.restore({
      id: orm.id,
      databaseId: orm.databaseId,
      values,
    });
  }

  private static valueToOrm(domain: RowValue): RowValueOrmEntity {
    const orm = new RowValueOrmEntity();

    orm.id = domain.getId();
    orm.rowId = domain.getRowId();
    orm.propertyId = domain.getPropertyId();
    orm.value = domain.getValue();

    return orm;
  }

  private static valueToDomain(orm: RowValueOrmEntity): RowValue {
    return new RowValue(orm.id, orm.rowId, orm.propertyId, orm.value);
  }
}
