import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  ActivityTargetNames,
  ActivityTargetRequest,
  PageActivityDetailsReader,
  PageCreation,
} from '../../../../application/ports/page-activity-details.reader.port';
import { Activity } from '../entities/activity.orm-entity';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuids(ids: string[]): string[] {
  return [...new Set(ids.filter((id) => UUID_PATTERN.test(id)))];
}

@Injectable()
export class TypeOrmPageActivityDetailsReader implements PageActivityDetailsReader {
  constructor(
    @InjectRepository(Activity)
    private readonly repo: Repository<Activity>,
  ) {}

  async findNames(
    request: ActivityTargetRequest,
  ): Promise<ActivityTargetNames> {
    const [rows, properties, options, users] = await Promise.all([
      this.select<{ id: string; value: unknown }>(
        `SELECT r.id, v.value
           FROM database_rows r
           JOIN database_properties p
             ON p.database_id = r.database_id AND p.type = 'TITLE'
           LEFT JOIN database_row_values v
             ON v.row_id = r.id AND v.property_id = p.id
          WHERE r.id = ANY($1::uuid[])`,
        request.rowIds,
      ),
      this.select<{ id: string; name: string; type: string }>(
        'SELECT id, name, type FROM database_properties WHERE id = ANY($1::uuid[])',
        request.propertyIds,
      ),
      this.select<{ id: string; name: string; color: string | null }>(
        'SELECT id, name, color FROM database_property_options WHERE id = ANY($1::uuid[])',
        request.optionIds,
      ),
      this.select<{ id: string; username: string | null }>(
        'SELECT id, username FROM users WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL',
        request.userIds,
      ),
    ]);

    return {
      rowTitles: new Map(
        rows.map((row) => [
          row.id,
          typeof row.value === 'string' ? row.value : '',
        ]),
      ),
      properties: new Map(
        properties.map((item) => [
          item.id,
          { name: item.name, type: item.type },
        ]),
      ),
      options: new Map(
        options.map((item) => [
          item.id,
          { name: item.name, color: item.color },
        ]),
      ),
      users: new Map(users.map((item) => [item.id, item.username])),
    };
  }

  async findPageCreation(pageId: string): Promise<PageCreation | null> {
    const [page] = await this.repo.query<
      { created_by: string | null; created_at: Date }[]
    >('SELECT created_by, created_at FROM pages WHERE id = $1', [pageId]);

    return page
      ? { createdBy: page.created_by, createdAt: page.created_at }
      : null;
  }

  private async select<T>(sql: string, ids: string[]): Promise<T[]> {
    const values = uuids(ids);
    if (values.length === 0) return [];
    return this.repo.query<T[]>(sql, [values]);
  }
}
