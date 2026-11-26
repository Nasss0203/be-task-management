import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  DatabasePeopleReader,
  DatabasePerson,
  DatabaseWorkspaceMember,
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

  findWorkspaceMembers(pageId: string): Promise<DatabaseWorkspaceMember[]> {
    return this.dataSource.query<DatabaseWorkspaceMember[]>(
      `
        SELECT
          u.id AS user_id,
          u.username AS username,
          u.email AS email,
          up.full_name AS full_name
        FROM pages p
        INNER JOIN workspace_members wm ON wm.workspace_id = p.workspace_id
        INNER JOIN users u ON u.id = wm.user_id AND u.deleted_at IS NULL
        LEFT JOIN user_profiles up ON up.user_id = u.id
        WHERE p.id = $1
      `,
      [pageId],
    );
  }
}
