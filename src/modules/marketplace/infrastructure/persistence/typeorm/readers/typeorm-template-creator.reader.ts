import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type {
  TemplateCreatorProfile,
  TemplateCreatorReader,
} from '../../../../application/ports/template-creator-reader.port';

@Injectable()
export class TypeOrmTemplateCreatorReader implements TemplateCreatorReader {
  constructor(private readonly dataSource: DataSource) {}

  async findProfiles(
    userIds: string[],
    context?: PersistenceContext,
  ): Promise<Map<string, TemplateCreatorProfile>> {
    const ids = [...new Set(userIds)];
    if (ids.length === 0) return new Map();

    const manager =
      context instanceof EntityManager ? context : this.dataSource.manager;
    const rows: {
      id: string;
      username: string;
      avatar_url: string | null;
      handle: string | null;
      display_name: string | null;
    }[] = await manager.query(
      `SELECT u.id, u.username, u.avatar_url, cp.handle, cp.display_name
       FROM users u
       LEFT JOIN creator_profiles cp ON cp.user_id = u.id
       WHERE u.id = ANY($1::uuid[]) AND u.deleted_at IS NULL`,
      [ids],
    );
    return new Map(
      rows.map((row) => [
        row.id,
        {
          id: row.id,
          username: row.username,
          avatarUrl: row.avatar_url,
          handle: row.handle ?? row.username.toLowerCase(),
          displayName: row.display_name,
        },
      ]),
    );
  }
}
