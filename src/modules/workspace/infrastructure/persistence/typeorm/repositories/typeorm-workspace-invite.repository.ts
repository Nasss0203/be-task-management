import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkspaceInvite } from 'src/modules/workspace/domain/aggregates/workspace-invite/workspace-invite.aggregate';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { WorkspaceInviteRepository } from 'src/modules/workspace/domain/repositories/workspace-invite.repository';
import { EntityManager, Repository } from 'typeorm';
import { WorkspaceInviteMapper } from '../mappers/workspace-invite.mapper';
import { WorkspaceInviteOrmEntity } from '../entities/workspace-invite.orm-entity';

@Injectable()
export class TypeOrmWorkspaceInviteRepository implements WorkspaceInviteRepository {
  constructor(
    @InjectRepository(WorkspaceInviteOrmEntity)
    private readonly repo: Repository<WorkspaceInviteOrmEntity>,
  ) {}

  private resolveManager(
    context?: PersistenceContext,
  ): EntityManager | undefined {
    return context as EntityManager | undefined;
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<WorkspaceInviteOrmEntity> {
    const entityManager = this.resolveManager(context);
    return entityManager
      ? entityManager.getRepository(WorkspaceInviteOrmEntity)
      : this.repo;
  }

  async save(
    invite: WorkspaceInvite,
    context?: PersistenceContext,
  ): Promise<WorkspaceInvite> {
    const repo = this.getRepo(context);

    const entity = WorkspaceInviteMapper.toOrm(invite);

    const saved = await repo.save(entity);

    return WorkspaceInviteMapper.toDomain(saved);
  }

  async findByToken(
    token: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceInvite | null> {
    const row = await this.getRepo(context).findOne({
      where: { token },
    });

    if (!row) {
      return null;
    }

    return WorkspaceInviteMapper.toDomain(row);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceInvite | null> {
    const row = await this.getRepo(context).findOne({
      where: { id },
    });

    if (!row) {
      return null;
    }

    return WorkspaceInviteMapper.toDomain(row);
  }

  async findByWorkspaceAndEmail(
    workspaceId: string,
    email: string,
    context?: PersistenceContext,
  ): Promise<WorkspaceInvite | null> {
    const row = await this.getRepo(context).findOne({
      where: { workspaceId, email },
    });

    if (!row) {
      return null;
    }

    return WorkspaceInviteMapper.toDomain(row);
  }
}
