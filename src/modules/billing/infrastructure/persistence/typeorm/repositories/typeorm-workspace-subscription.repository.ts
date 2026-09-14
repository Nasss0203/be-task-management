import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, Repository } from 'typeorm';
import { WorkspaceSubscription } from '../../../../domain/entities/workspace-subscription.entity';
import type { WorkspaceSubscriptionRepository } from '../../../../domain/repositories/workspace-subscription.repository';
import { WorkspaceSubscriptionOrmEntity } from '../entities/workspace-subscription.orm-entity';
import { WorkspaceSubscriptionMapper } from '../mappers/workspace-subscription.mapper';

@Injectable()
export class TypeOrmWorkspaceSubscriptionRepository implements WorkspaceSubscriptionRepository {
  constructor(
    @InjectRepository(WorkspaceSubscriptionOrmEntity)
    private readonly repository: Repository<WorkspaceSubscriptionOrmEntity>,
  ) {}

  private getRepository(
    context?: PersistenceContext,
  ): Repository<WorkspaceSubscriptionOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(WorkspaceSubscriptionOrmEntity)
      : this.repository;
  }

  async save(
    subscription: WorkspaceSubscription,
    context?: PersistenceContext,
  ): Promise<WorkspaceSubscription> {
    const repository = this.getRepository(context);

    const saved = await repository.save(
      WorkspaceSubscriptionMapper.toOrm(subscription),
    );

    return WorkspaceSubscriptionMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceSubscription | null> {
    const entity = await this.getRepository(context).findOne({
      where: {
        id,
      },
    });

    return entity ? WorkspaceSubscriptionMapper.toDomain(entity) : null;
  }

  async findByWorkspaceId(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceSubscription | null> {
    const entity = await this.getRepository(context).findOne({
      where: {
        workspace_id: workspaceId,
      },
    });

    return entity ? WorkspaceSubscriptionMapper.toDomain(entity) : null;
  }
}
