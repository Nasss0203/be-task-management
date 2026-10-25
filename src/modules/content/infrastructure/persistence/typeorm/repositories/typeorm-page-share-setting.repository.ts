import { withPagePermissionWriteLock } from 'src/shared/infrastructure/persistence/page-permission-write-lock';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import type { Repository } from 'typeorm';
import { EntityManager } from 'typeorm';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import type { PageShareSettingRepository } from '../../../../domain/repositories/page-share-setting.repository';

import { PageShareSetting } from '../../../../domain/entities/page-share-setting.entity';

import { PageShareSettingOrmEntity } from '../entities/page-share-setting.orm-entity';

import { PageShareSettingMapper } from '../mappers/page-share-setting.mapper';

@Injectable()
export class TypeOrmPageShareSettingRepository implements PageShareSettingRepository {
  constructor(
    @InjectRepository(PageShareSettingOrmEntity)
    private readonly repo: Repository<PageShareSettingOrmEntity>,
  ) {}

  private resolveRepo(
    context?: PersistenceContext,
  ): Repository<PageShareSettingOrmEntity> {
    if (context) {
      return (context as EntityManager).getRepository(
        PageShareSettingOrmEntity,
      );
    }

    return this.repo;
  }

  async findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageShareSetting | null> {
    const orm = await this.resolveRepo(context).findOne({
      where: {
        page_id: pageId,
      },
    });

    return orm ? PageShareSettingMapper.toDomain(orm) : null;
  }

  async save(
    setting: PageShareSetting,
    context?: PersistenceContext,
  ): Promise<PageShareSetting> {
    const manager = context ? (context as EntityManager) : this.repo.manager;
    return withPagePermissionWriteLock(
      manager,
      setting.getPageId(),
      async (transaction) => {
        const saved = await transaction
          .getRepository(PageShareSettingOrmEntity)
          .save(PageShareSettingMapper.toOrm(setting));
        return PageShareSettingMapper.toDomain(saved);
      },
    );
  }
}
