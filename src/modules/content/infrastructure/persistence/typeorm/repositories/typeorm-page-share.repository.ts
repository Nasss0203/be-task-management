import { Injectable } from '@nestjs/common';

import { DataSource, EntityManager, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import type {
  PageShareDetails,
  PageShareRepository,
} from '../../../../domain/repositories/page-share.repository';

import type { PageShare } from '../../../../domain/entities/page-share.entity';

import { PageShareOrmEntity } from '../entities/page-share.orm-entity';
import { PageShareMapper } from '../mappers/page-share.mapper';

@Injectable()
export class TypeOrmPageShareRepository implements PageShareRepository {
  constructor(private readonly dataSource: DataSource) {}

  private resolveRepository(
    context?: PersistenceContext,
  ): Repository<PageShareOrmEntity> {
    if (context) {
      const manager = context as EntityManager;

      return manager.getRepository(PageShareOrmEntity);
    }

    return this.dataSource.getRepository(PageShareOrmEntity);
  }

  async save(
    pageShare: PageShare,
    context?: PersistenceContext,
  ): Promise<PageShare> {
    const repository = this.resolveRepository(context);

    const orm = PageShareMapper.toOrm(pageShare);

    const saved = await repository.save(orm);

    return PageShareMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageShare | null> {
    const repository = this.resolveRepository(context);

    const orm = await repository.findOne({
      where: {
        id,
      },
    });

    return orm ? PageShareMapper.toDomain(orm) : null;
  }

  async findByPageAndUser(
    pageId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<PageShare | null> {
    const repository = this.resolveRepository(context);

    const orm = await repository.findOne({
      where: {
        page_id: pageId,
        user_id: userId,
      },
    });

    return orm ? PageShareMapper.toDomain(orm) : null;
  }

  async findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageShare[]> {
    const repository = this.resolveRepository(context);

    const rows = await repository.find({
      where: {
        page_id: pageId,
      },
      order: {
        created_at: 'ASC',
      },
    });

    return rows.map(PageShareMapper.toDomain);
  }

  async findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<PageShare[]> {
    const repository = this.resolveRepository(context);

    const entities = await repository.find({
      where: {
        user_id: userId,
      },

      order: {
        created_at: 'DESC',
      },
    });

    return entities.map(PageShareMapper.toDomain);
  }

  async findDetailsByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageShareDetails[]> {
    const repository = this.resolveRepository(context);

    const rows = await repository
      .createQueryBuilder('share')
      .innerJoin('users', 'user', 'user.id = share.user_id')
      .leftJoin('user_profiles', 'profile', 'profile.user_id = user.id')
      .select('share.id', 'id')
      .addSelect('share.user_id', 'userId')
      .addSelect('share.access_level', 'accessLevel')
      .addSelect('share.created_by', 'createdBy')
      .addSelect('share.created_at', 'createdAt')
      .addSelect('share.updated_at', 'updatedAt')

      .addSelect('user.id', 'userInfoId')
      .addSelect('user.username', 'username')
      .addSelect('user.email', 'email')
      .addSelect('user.avatar_url', 'avatarUrl')

      .addSelect('profile.display_name', 'profileDisplayName')
      .addSelect('profile.full_name', 'profileFullName')

      .where('share.page_id = :pageId', {
        pageId,
      })
      .orderBy('share.created_at', 'ASC')
      .getRawMany<{
        id: string;
        userId: string;
        accessLevel: PageShareDetails['accessLevel'];
        createdBy: string;
        createdAt: Date;
        updatedAt: Date;

        userInfoId: string;
        username: string;
        email: string;
        avatarUrl: string | null;

        profileDisplayName: string | null;
        profileFullName: string | null;
      }>();

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      accessLevel: row.accessLevel,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,

      user: {
        id: row.userInfoId,
        username: row.username,

        displayName:
          row.profileDisplayName ?? row.profileFullName ?? row.username,

        email: row.email,
        avatarUrl: row.avatarUrl,
      },
    }));
  }

  async deleteByPageAndUser(
    pageId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    const repository = this.resolveRepository(context);

    await repository.delete({
      page_id: pageId,
      user_id: userId,
    });
  }

  async exists(
    pageId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<boolean> {
    const repository = this.resolveRepository(context);

    return repository.exists({
      where: {
        page_id: pageId,
        user_id: userId,
      },
    });
  }
}
