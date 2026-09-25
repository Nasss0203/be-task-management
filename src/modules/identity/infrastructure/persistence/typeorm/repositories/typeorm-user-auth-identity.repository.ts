import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateUserAuthIdentityInput,
  UpdateUserAuthIdentityLoginMetadataInput,
  UserAuthIdentityKey,
  UserAuthIdentityRepository,
} from 'src/modules/identity/domain/repositories/user-auth-identity.repository';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { UserAuthIdentityModel } from '../../../../domain/aggregates/user-auth-identity/user-auth-identity.model';
import { UserAuthIdentityOrmEntity } from '../entities/user-auth-identity.orm-entity';
import { UserAuthIdentityMapper } from '../mappers/user-auth-identity.mapper';

@Injectable()
export class TypeOrmUserAuthIdentityRepository implements UserAuthIdentityRepository {
  constructor(
    @InjectRepository(UserAuthIdentityOrmEntity)
    private readonly userAuthIdentityRepo: Repository<UserAuthIdentityOrmEntity>,
  ) {}

  private getRepo(
    context?: PersistenceContext,
  ): Repository<UserAuthIdentityOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(UserAuthIdentityOrmEntity)
      : this.userAuthIdentityRepo;
  }

  async findByProviderIdentity(
    key: UserAuthIdentityKey,
    context?: PersistenceContext,
  ): Promise<UserAuthIdentityModel | null> {
    const identity = await this.getRepo(context).findOne({
      where: {
        provider: key.provider,
        issuer: key.issuer,
        providerSubject: key.providerSubject,
        tenantId: key.tenantId === null ? IsNull() : key.tenantId,
      },
    });

    return identity ? UserAuthIdentityMapper.toModel(identity) : null;
  }

  async findByUserId(
    userId: string,
    context?: PersistenceContext,
  ): Promise<UserAuthIdentityModel[]> {
    const identities = await this.getRepo(context).find({
      where: { userId },
      order: { createdAt: 'ASC', id: 'ASC' },
    });

    return identities.map((identity) =>
      UserAuthIdentityMapper.toModel(identity),
    );
  }

  async create(
    input: CreateUserAuthIdentityInput,
    context?: PersistenceContext,
  ): Promise<UserAuthIdentityModel> {
    const repo = this.getRepo(context);
    const identity = repo.create(input);
    const savedIdentity = await repo.save(identity);

    return UserAuthIdentityMapper.toModel(savedIdentity);
  }

  async updateLoginMetadata(
    identityId: string,
    input: UpdateUserAuthIdentityLoginMetadataInput,
    context?: PersistenceContext,
  ): Promise<UserAuthIdentityModel | null> {
    const repo = this.getRepo(context);
    const identity = await repo.findOne({
      where: { id: identityId },
    });

    if (!identity) return null;

    identity.providerEmail = input.providerEmail;
    identity.emailVerified = input.emailVerified;
    identity.tenantId = input.tenantId;
    identity.lastLoginAt = input.lastLoginAt;
    identity.updatedAt = new Date();

    const savedIdentity = await repo.save(identity);

    return UserAuthIdentityMapper.toModel(savedIdentity);
  }
}
