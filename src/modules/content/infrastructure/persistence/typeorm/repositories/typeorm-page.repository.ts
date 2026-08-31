import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { Repository } from 'typeorm';
import { EntityManager } from 'typeorm';
import { PageOrmEntity } from '../entities/page.orm-entity';
import { PageMapper } from '../mappers/page.mapper';

@Injectable()
export class TypeOrmPageRepository implements PageRepository {
  constructor(
    @InjectRepository(PageOrmEntity)
    private readonly repo: Repository<PageOrmEntity>,
  ) {}

  private resolveRepo(context?: PersistenceContext): Repository<PageOrmEntity> {
    if (context) {
      return (context as EntityManager).getRepository(PageOrmEntity);
    }
    return this.repo;
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<Page | null> {
    const orm = await this.resolveRepo(context).findOne({
      where: { id },
    });
    return orm ? PageMapper.toDomain(orm) : null;
  }

  async findByWorkspace(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<Page[]> {
    const orms = await this.resolveRepo(context).find({
      where: { workspace_id: workspaceId },
      order: { createdAt: 'ASC' },
    });
    return orms.map((orm) => PageMapper.toDomain(orm));
  }

  async findDeletedByWorkspace(
    workspaceId: string,
    context?: PersistenceContext,
  ): Promise<Page[]> {
    const qb = this.resolveRepo(context)
      .createQueryBuilder('page')
      .withDeleted()
      .where('page.workspace_id = :workspaceId', { workspaceId })
      .andWhere('page.deleted_at IS NOT NULL')
      .orderBy('page.deleted_at', 'DESC');
    const orms = await qb.getMany();
    return orms.map((orm) => PageMapper.toDomain(orm));
  }

  async save(page: Page, context?: PersistenceContext): Promise<Page> {
    const repo = this.resolveRepo(context);
    const orm = PageMapper.toOrm(page);
    const saved = await repo.save(orm);
    return PageMapper.toDomain(saved);
  }

  async delete(id: string, context?: PersistenceContext): Promise<void> {
    await this.resolveRepo(context).softDelete(id);
  }

  async deletePermanently(
    id: string,
    context?: PersistenceContext,
  ): Promise<void> {
    await this.resolveRepo(context).delete({ id });
  }

  async existsBySlug(
    workspaceId: string,
    slug: string,
    context?: PersistenceContext,
  ): Promise<boolean> {
    const count = await this.resolveRepo(context).count({
      where: { workspace_id: workspaceId, slug },
    });
    return count > 0;
  }

  async findDeletedById(
    id: string,
    context?: PersistenceContext,
  ): Promise<Page | null> {
    const orm = await this.resolveRepo(context).findOne({
      where: { id },
      withDeleted: true,
    });
    if (orm && orm.deletedAt !== null) {
      return PageMapper.toDomain(orm);
    }
    return null;
  }

  async findAccessibleByWorkspace(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<Page[]> {
    const qb = this.resolveRepo(context)
      .createQueryBuilder('page')

      /**
       * User phải là member của Workspace.
       */
      .innerJoin(
        'workspace_members',
        'workspace_member',
        `
        workspace_member.workspace_id = page.workspace_id
        AND workspace_member.user_id = :userId
      `,
        { userId },
      )

      /**
       * Nếu Page thuộc Teamspace,
       * kiểm tra user có membership trong Teamspace đó không.
       */
      .leftJoin(
        'teamspace_members',
        'teamspace_member',
        `
        teamspace_member.teamspace_id = page.teamspace_id
        AND teamspace_member.workspace_member_id = workspace_member.id
      `,
      )

      .where('page.workspace_id = :workspaceId', {
        workspaceId,
      })

      .andWhere(
        `
        (
          workspace_member.role_name = :ownerRole
          OR page.teamspace_id IS NULL
          OR teamspace_member.id IS NOT NULL
        )
      `,
        {
          ownerRole: WorkspaceRole.OWNER,
        },
      )

      .distinct(true)
      .orderBy('page.created_at', 'ASC');

    const orms = await qb.getMany();

    return orms.map((orm) => PageMapper.toDomain(orm));
  }

  async findAccessibleDeletedByWorkspace(
    workspaceId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<Page[]> {
    const qb = this.resolveRepo(context)
      .createQueryBuilder('page')
      .withDeleted()
      .innerJoin(
        'workspace_members',
        'workspace_member',
        `
        workspace_member.workspace_id = page.workspace_id
        AND workspace_member.user_id = :userId
      `,
        { userId },
      )

      .leftJoin(
        'teamspace_members',
        'teamspace_member',
        `
        teamspace_member.teamspace_id = page.teamspace_id
        AND teamspace_member.workspace_member_id = workspace_member.id
      `,
      )

      .where('page.workspace_id = :workspaceId', {
        workspaceId,
      })

      .andWhere('page.deleted_at IS NOT NULL')
      .andWhere(
        `
        (
          workspace_member.role_name = :ownerRole
          OR page.teamspace_id IS NULL
          OR teamspace_member.id IS NOT NULL
        )
      `,
        {
          ownerRole: WorkspaceRole.OWNER,
        },
      )
      .distinct(true)
      .orderBy('page.deleted_at', 'DESC');

    const orms = await qb.getMany();

    return orms.map((orm) => PageMapper.toDomain(orm));
  }
}
