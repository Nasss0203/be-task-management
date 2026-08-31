import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import {
  ResourceAuthorizationContext,
  ResourceAuthorizationReader,
} from 'src/modules/permission/application/ports/resource-authorization-reader.port';

import { PageBlockOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page-block.orm-entity';
import { PageOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page.orm-entity';

@Injectable()
export class TypeOrmResourceAuthorizationReader implements ResourceAuthorizationReader {
  constructor(
    @InjectRepository(PageOrmEntity)
    private readonly pageRepository: Repository<PageOrmEntity>,

    @InjectRepository(PageBlockOrmEntity)
    private readonly pageBlockRepository: Repository<PageBlockOrmEntity>,
  ) {}

  async findPageContext(
    pageId: string,
  ): Promise<ResourceAuthorizationContext | null> {
    const page = await this.pageRepository.findOne({
      where: {
        id: pageId,
        deletedAt: IsNull(),
      },
      select: {
        id: true,
        workspace_id: true,
        teamspace_id: true,
      },
    });

    if (!page) {
      return null;
    }

    return {
      workspaceId: page.workspace_id,
      teamspaceId: page.teamspace_id,
    };
  }

  async findPageBlockContext(
    blockId: string,
  ): Promise<ResourceAuthorizationContext | null> {
    const block = await this.pageBlockRepository.findOne({
      where: {
        id: blockId,
        deleted_at: IsNull(),
      },
      select: {
        id: true,
        page_id: true,
      },
    });

    if (!block) {
      return null;
    }

    return this.findPageContext(block.page_id);
  }
}
