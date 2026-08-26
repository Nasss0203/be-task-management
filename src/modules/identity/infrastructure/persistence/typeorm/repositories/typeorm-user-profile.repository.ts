import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { UserProfileAggregate } from 'src/modules/identity/domain/aggregates/user-profile/user-profile.aggregate';
import { UserProfileRepository } from 'src/modules/identity/domain/repositories/user-profile.repository';
import { UserProfile } from 'src/modules/identity/infrastructure/persistence/typeorm/entities/user-profile.orm-entity';
import { UserProfileMapper } from 'src/modules/identity/infrastructure/persistence/typeorm/mappers/user-profile.mapper';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

@Injectable()
export class TypeOrmUserProfileRepository implements UserProfileRepository {
  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepo: Repository<UserProfile>,
  ) {}

  private getRepo(context?: PersistenceContext): Repository<UserProfile> {
    return context
      ? (context as EntityManager).getRepository(UserProfile)
      : this.userProfileRepo;
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<UserProfileAggregate | null> {
    const entity = await this.getRepo(context).findOne({
      where: { id },
    });

    return entity ? UserProfileMapper.toDomain(entity) : null;
  }

  async findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<UserProfileAggregate | null> {
    const entity = await this.getRepo(context).findOne({
      where: { userId },
    });

    return entity ? UserProfileMapper.toDomain(entity) : null;
  }

  async save(
    profile: UserProfileAggregate,
    context?: PersistenceContext,
  ): Promise<void> {
    const entity = UserProfileMapper.toPersistence(profile);

    await this.getRepo(context).save(entity);
  }
}
