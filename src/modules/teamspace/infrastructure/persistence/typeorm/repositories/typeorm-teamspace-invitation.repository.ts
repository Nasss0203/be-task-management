import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TeamspaceInvitation } from 'src/modules/teamspace/domain/entities/teamspace-invitation.entity';
import { TeamspaceInvitationStatus } from 'src/modules/teamspace/domain/enums/teamspace-invitation-status.enum';
import type { TeamspaceInvitationRepository } from 'src/modules/teamspace/domain/repositories/teamspace-invitation.repository';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager, Repository } from 'typeorm';
import { TeamspaceInvitationOrmEntity } from '../entities/teamspace-invitation.orm-entity';
import { TeamspaceInvitationMapper } from '../mappers/teamspace-invitation.mapper';

@Injectable()
export class TypeOrmTeamspaceInvitationRepository implements TeamspaceInvitationRepository {
  constructor(
    @InjectRepository(TeamspaceInvitationOrmEntity)
    private readonly repository: Repository<TeamspaceInvitationOrmEntity>,
  ) {}

  private getRepository(context?: PersistenceContext): Repository<TeamspaceInvitationOrmEntity> {
    return context
      ? (context as EntityManager).getRepository(TeamspaceInvitationOrmEntity)
      : this.repository;
  }

  async save(invitation: TeamspaceInvitation, context?: PersistenceContext): Promise<TeamspaceInvitation> {
    const saved = await this.getRepository(context).save(TeamspaceInvitationMapper.toOrm(invitation));
    return TeamspaceInvitationMapper.toDomain(saved);
  }

  async findById(id: string, context?: PersistenceContext): Promise<TeamspaceInvitation | null> {
    const row = await this.getRepository(context).findOne({ where: { id } });
    return row ? TeamspaceInvitationMapper.toDomain(row) : null;
  }

  async findPendingByTeamspaceAndWorkspaceMember(
    teamspaceId: string,
    workspaceMemberId: string,
    context?: PersistenceContext,
  ): Promise<TeamspaceInvitation | null> {
    const row = await this.getRepository(context).findOne({
      where: { teamspaceId, workspaceMemberId, status: TeamspaceInvitationStatus.PENDING },
    });
    return row ? TeamspaceInvitationMapper.toDomain(row) : null;
  }

  async findByRecipientUserId(userId: string, context?: PersistenceContext): Promise<TeamspaceInvitation[]> {
    const rows = await this.getRepository(context)
      .createQueryBuilder('invitation')
      .innerJoin('invitation.workspaceMember', 'recipient')
      .innerJoin('invitation.teamspace', 'teamspace', 'teamspace.deleted_at IS NULL')
      .where('recipient.user_id = :userId', { userId })
      .orderBy('invitation.createdAt', 'DESC')
      .getMany();
    return rows.map(TeamspaceInvitationMapper.toDomain);
  }
}
