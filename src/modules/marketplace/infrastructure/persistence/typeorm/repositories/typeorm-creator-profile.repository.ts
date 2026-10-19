import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PersistenceContext } from 'src/shared/domain/persistence-context';
import { EntityManager, Repository } from 'typeorm';

import { CreatorProfile } from '../../../../domain/entities/creator-profile.entity';
import type { CreatorProfileRepository } from '../../../../domain/repositories/creator-profile.repository';
import { CreatorProfileOrmEntity } from '../entities/creator-profile.orm-entity';
import { CreatorProfileMapper } from '../mappers/creator-profile.mapper';

@Injectable()
export class TypeOrmCreatorProfileRepository implements CreatorProfileRepository {
  constructor(
    @InjectRepository(CreatorProfileOrmEntity)
    private readonly repository: Repository<CreatorProfileOrmEntity>,
  ) {}

  private getRepository(
    context?: PersistenceContext,
  ): Repository<CreatorProfileOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(CreatorProfileOrmEntity)
      : this.repository;
  }

  async findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<CreatorProfile | null> {
    const entity = await this.getRepository(context).findOne({
      where: { userId },
    });

    return entity ? CreatorProfileMapper.toDomain(entity) : null;
  }

  async save(
    profile: CreatorProfile,
    context?: PersistenceContext,
  ): Promise<CreatorProfile> {
    const saved = await this.getRepository(context).save(
      CreatorProfileMapper.toOrm(profile),
    );

    return CreatorProfileMapper.toDomain(saved);
  }
}
