import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  DatabasePeopleReader,
  DatabasePerson,
} from 'src/modules/database/application/ports/database-people-reader.port';

@Injectable()
export class TypeOrmDatabasePeopleReader implements DatabasePeopleReader {
  constructor(private readonly dataSource: DataSource) {}

  findByDatabaseId(databaseId: string): Promise<DatabasePerson[]> {
    return this.dataSource.query<DatabasePerson[]>(
      `
        SELECT DISTINCT
          u.id AS user_id,
          u.username AS full_name,
          u.avatar_url AS avatar_url
        FROM database_row_values v
        INNER JOIN database_rows r
          ON r.id = v.row_id
         AND r.database_id = $1
        INNER JOIN database_properties p
          ON p.id = v.property_id
         AND p.type = 'PERSON'
        CROSS JOIN LATERAL jsonb_array_elements_text(
          CASE WHEN jsonb_typeof(v.value) = 'array' THEN v.value ELSE '[]'::jsonb END
        ) AS person(user_id)
        INNER JOIN users u
          ON u.id::text = person.user_id
      `,
      [databaseId],
    );
  }
}
