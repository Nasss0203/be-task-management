import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  PageVisitRecord,
  PageVisitRepository,
} from 'src/modules/content/domain/repositories/page-visit.repository';

import { PageVisitOrmEntity } from '../entities/page-visit.orm-entity';

@Injectable()
export class TypeOrmPageVisitRepository implements PageVisitRepository {
  constructor(private readonly dataSource: DataSource) {}

  async record(visit: PageVisitRecord): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(PageVisitOrmEntity)
      .values({
        user_id: visit.userId,
        page_id: visit.pageId,
        workspace_id: visit.workspaceId,
        visited_at: visit.visitedAt,
      })
      .orUpdate(['visited_at', 'workspace_id'], ['user_id', 'page_id'])
      .execute();
  }
}
