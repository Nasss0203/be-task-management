import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TeamspaceInviteLink } from 'src/modules/teamspace/domain/entities/teamspace-invite-link.entity';
import type { TeamspaceInviteLinkRepository } from 'src/modules/teamspace/domain/repositories/teamspace-invite-link.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, Repository } from 'typeorm';
import { TeamspaceInviteLinkOrmEntity } from '../entities/teamspace-invite-link.orm-entity';
import { TeamspaceInviteLinkMapper } from '../mappers/teamspace-invite-link.mapper';

@Injectable()
export class TypeOrmTeamspaceInviteLinkRepository implements TeamspaceInviteLinkRepository {
  constructor(
    @InjectRepository(TeamspaceInviteLinkOrmEntity)
    private readonly repository: Repository<TeamspaceInviteLinkOrmEntity>,
  ) {}

  private getRepository(context?: PersistenceContext): Repository<TeamspaceInviteLinkOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(TeamspaceInviteLinkOrmEntity)
      : this.repository;
  }

  async save(link: TeamspaceInviteLink, context?: PersistenceContext): Promise<TeamspaceInviteLink> {
    const saved = await this.getRepository(context).save(TeamspaceInviteLinkMapper.toOrm(link));
    return TeamspaceInviteLinkMapper.toDomain(saved);
  }

  async findById(id: string, context?: PersistenceContext): Promise<TeamspaceInviteLink | null> {
    const row = await this.getRepository(context).findOne({ where: { id } });
    return row ? TeamspaceInviteLinkMapper.toDomain(row) : null;
  }

  async findByIdForUpdate(id: string, context: PersistenceContext): Promise<TeamspaceInviteLink | null> {
    const manager = context as EntityManager;
    if (!manager.queryRunner?.isTransactionActive) {
      throw new Error('Invite link row lock requires an active transaction');
    }
    const row = await this.getRepository(context)
      .createQueryBuilder('link')
      .where('link.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();
    return row ? TeamspaceInviteLinkMapper.toDomain(row) : null;
  }

  async findByTokenHash(tokenHash: string, context?: PersistenceContext): Promise<TeamspaceInviteLink | null> {
    const row = await this.getRepository(context).findOne({ where: { tokenHash } });
    return row ? TeamspaceInviteLinkMapper.toDomain(row) : null;
  }

  async findByTeamspaceId(teamspaceId: string, context?: PersistenceContext): Promise<TeamspaceInviteLink[]> {
    const rows = await this.getRepository(context).find({
      where: { teamspaceId }, order: { createdAt: 'DESC' },
    });
    return rows.map(TeamspaceInviteLinkMapper.toDomain);
  }
}
