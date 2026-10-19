import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import { EntityManager, Repository } from 'typeorm';

import type { TemplateLikeRepository } from '../../../../domain/repositories/template-like.repository';
import { TemplateLikeOrmEntity } from '../entities/template-like.orm-entity';

@Injectable()
export class TypeOrmTemplateLikeRepository implements TemplateLikeRepository {
  constructor(
    @InjectRepository(TemplateLikeOrmEntity)
    private readonly repository: Repository<TemplateLikeOrmEntity>,
  ) {}

  private getRepository(
    context?: PersistenceContext,
  ): Repository<TemplateLikeOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(TemplateLikeOrmEntity)
      : this.repository;
  }

  async add(
    templateId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    await this.getRepository(context)
      .createQueryBuilder()
      .insert()
      .into(TemplateLikeOrmEntity)
      .values({ templateId, userId })
      .orIgnore()
      .execute();
  }

  async remove(
    templateId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<void> {
    await this.getRepository(context).delete({ templateId, userId });
  }
}
