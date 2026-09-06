import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type { PageSharePermissionReader } from '../../../../application/ports/page-share-permission-reader.port';
import type { PageShareAccessLevel } from '../../../../domain/policies/page-share-permission.policy';

interface PageShareAccessRow {
  accessLevel: PageShareAccessLevel;
}

@Injectable()
export class TypeOrmPageSharePermissionReader implements PageSharePermissionReader {
  constructor(private readonly dataSource: DataSource) {}

  async findAccessLevel(
    pageId: string,
    userId: string,
  ): Promise<PageShareAccessLevel | null> {
    const row = await this.dataSource
      .createQueryBuilder()
      .select('page_share.access_level', 'accessLevel')
      .from('page_shares', 'page_share')
      .where('page_share.page_id = :pageId', {
        pageId,
      })
      .andWhere('page_share.user_id = :userId', {
        userId,
      })
      .getRawOne<PageShareAccessRow>();

    return row?.accessLevel ?? null;
  }
}
