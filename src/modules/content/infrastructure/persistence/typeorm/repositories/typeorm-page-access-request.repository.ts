import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

import { PageAccessRequestStatus } from '../../../../domain/constants/page-access-request-status.constant';
import type { PageAccessRequest } from '../../../../domain/entities/page-access-request.entity';
import type {
  PageAccessRequestDetails,
  PageAccessRequestRepository,
} from '../../../../domain/repositories/page-access-request.repository';

import { PageAccessRequestOrmEntity } from '../entities/page-access-request.orm-entity';
import { PageAccessRequestMapper } from '../mappers/page-access-request.mapper';

@Injectable()
export class TypeOrmPageAccessRequestRepository implements PageAccessRequestRepository {
  constructor(private readonly dataSource: DataSource) {}

  private resolveRepository(
    context?: PersistenceContext,
  ): Repository<PageAccessRequestOrmEntity> {
    if (context) {
      const manager = context as EntityManager;

      return manager.getRepository(PageAccessRequestOrmEntity);
    }

    return this.dataSource.getRepository(PageAccessRequestOrmEntity);
  }

  async save(
    request: PageAccessRequest,
    context?: PersistenceContext,
  ): Promise<PageAccessRequest> {
    const repository = this.resolveRepository(context);

    const saved = await repository.save(PageAccessRequestMapper.toOrm(request));

    return PageAccessRequestMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<PageAccessRequest | null> {
    const repository = this.resolveRepository(context);

    const orm = await repository.findOne({
      where: {
        id,
      },
    });

    return orm ? PageAccessRequestMapper.toDomain(orm) : null;
  }

  async findPendingByPageAndUser(
    pageId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<PageAccessRequest | null> {
    const repository = this.resolveRepository(context);

    const orm = await repository.findOne({
      where: {
        page_id: pageId,
        user_id: userId,
        status: PageAccessRequestStatus.PENDING,
      },
    });

    return orm ? PageAccessRequestMapper.toDomain(orm) : null;
  }

  async findByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageAccessRequest[]> {
    const repository = this.resolveRepository(context);

    const rows = await repository.find({
      where: {
        page_id: pageId,
      },
      order: {
        created_at: 'DESC',
      },
    });

    return rows.map(PageAccessRequestMapper.toDomain);
  }

  async findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<PageAccessRequest[]> {
    const repository = this.resolveRepository(context);

    const rows = await repository.find({
      where: {
        user_id: userId,
      },
      order: {
        created_at: 'DESC',
      },
    });

    return rows.map(PageAccessRequestMapper.toDomain);
  }

  async findPendingByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageAccessRequest[]> {
    const repository = this.resolveRepository(context);

    const rows = await repository.find({
      where: {
        page_id: pageId,
        status: PageAccessRequestStatus.PENDING,
      },
      order: {
        created_at: 'DESC',
      },
    });

    return rows.map(PageAccessRequestMapper.toDomain);
  }

  async findPendingDetailsByPageId(
    pageId: string,
    context?: PersistenceContext,
  ): Promise<PageAccessRequestDetails[]> {
    const repository = this.resolveRepository(context);

    const rows = await repository
      .createQueryBuilder('request')
      .innerJoin('users', 'user', 'user.id = request.user_id')
      .leftJoin('user_profiles', 'profile', 'profile.user_id = user.id')
      .select('request.id', 'id')
      .addSelect('request.page_id', 'pageId')
      .addSelect('request.user_id', 'userId')
      .addSelect('request.status', 'status')
      .addSelect('request.created_at', 'createdAt')
      .addSelect('user.id', 'userInfoId')
      .addSelect('user.username', 'username')
      .addSelect('user.email', 'email')
      .addSelect('user.avatar_url', 'avatarUrl')
      .addSelect('profile.display_name', 'profileDisplayName')
      .addSelect('profile.full_name', 'profileFullName')
      .where('request.page_id = :pageId', {
        pageId,
      })
      .andWhere('request.status = :status', {
        status: PageAccessRequestStatus.PENDING,
      })
      .orderBy('request.created_at', 'DESC')
      .getRawMany<{
        id: string;
        pageId: string;
        userId: string;
        status: PageAccessRequestDetails['status'];
        createdAt: Date;
        userInfoId: string;
        username: string;
        email: string;
        avatarUrl: string | null;
        profileDisplayName: string | null;
        profileFullName: string | null;
      }>();

    return rows.map((row) => ({
      id: row.id,
      pageId: row.pageId,
      userId: row.userId,
      status: row.status,
      createdAt: row.createdAt,
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
}
