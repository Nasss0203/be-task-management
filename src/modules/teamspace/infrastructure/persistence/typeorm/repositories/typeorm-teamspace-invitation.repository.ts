import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TeamspaceInvitation } from 'src/modules/teamspace/domain/entities/teamspace-invitation.entity';
import { TeamspaceInvitationStatus } from 'src/modules/teamspace/domain/enums/teamspace-invitation-status.enum';
import type { RecipientTeamspaceInvitation, TeamspaceInvitationRepository } from 'src/modules/teamspace/domain/repositories/teamspace-invitation.repository';
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

  private assertTransaction(context: PersistenceContext): void {
    if (!(context as EntityManager).queryRunner?.isTransactionActive) {
      throw new Error('Invitation row lock requires an active transaction');
    }
  }

  async findByIdForUpdate(id: string, context: PersistenceContext): Promise<TeamspaceInvitation | null> {
    this.assertTransaction(context);
    const row = await this.getRepository(context).createQueryBuilder('invitation')
      .where('invitation.id = :id', { id })
      .setLock('pessimistic_write')
      .getOne();
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

  async findPendingByTeamspaceAndWorkspaceMemberForUpdate(
    teamspaceId: string,
    workspaceMemberId: string,
    context: PersistenceContext,
  ): Promise<TeamspaceInvitation | null> {
    this.assertTransaction(context);
    const row = await this.getRepository(context).createQueryBuilder('invitation')
      .where('invitation.teamspaceId = :teamspaceId', { teamspaceId })
      .andWhere('invitation.workspaceMemberId = :workspaceMemberId', { workspaceMemberId })
      .andWhere('invitation.status = :status', { status: TeamspaceInvitationStatus.PENDING })
      .setLock('pessimistic_write')
      .getOne();
    return row ? TeamspaceInvitationMapper.toDomain(row) : null;
  }

  async listByTeamspace(params: {
    teamspaceId: string;
    status?: TeamspaceInvitationStatus;
    page: number;
    limit: number;
    now: Date;
  }): Promise<{ invitations: TeamspaceInvitation[]; total: number }> {
    const effectiveStatus = `CASE WHEN invitation.status = 'PENDING' AND invitation.expires_at <= :now THEN 'EXPIRED' ELSE invitation.status END`;
    const query = this.repository.createQueryBuilder('invitation')
      .where('invitation.teamspaceId = :teamspaceId', { teamspaceId: params.teamspaceId })
      .setParameter('now', params.now);
    if (params.status) {
      query.andWhere(`${effectiveStatus} = :status`, { status: params.status });
    }
    const [rows, total] = await query
      .orderBy('invitation.createdAt', 'DESC')
      .addOrderBy('invitation.id', 'DESC')
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getManyAndCount();
    return { invitations: rows.map(TeamspaceInvitationMapper.toDomain), total };
  }

  async findByRecipientUserId(userId: string, context?: PersistenceContext): Promise<RecipientTeamspaceInvitation[]> {
    const rows = await this.getRepository(context)
      .createQueryBuilder('invitation')
      .innerJoin('invitation.workspaceMember', 'recipient')
      .innerJoin('invitation.teamspace', 'teamspace', 'teamspace.deleted_at IS NULL')
      .innerJoin('teamspace.workspace', 'workspace', 'workspace.deleted_at IS NULL')
      .leftJoin('invitation.inviter', 'inviter', 'inviter.deleted_at IS NULL')
      // Only display columns; never load the inviter's full user row.
      .addSelect(['teamspace.id', 'teamspace.name', 'teamspace.icon', 'workspace.id', 'workspace.name', 'inviter.id', 'inviter.username'])
      .where('recipient.user_id = :userId', { userId })
      .orderBy('invitation.createdAt', 'DESC')
      .getMany();
    return rows.map((row) => ({
      invitation: TeamspaceInvitationMapper.toDomain(row),
      teamspaceName: row.teamspace.name,
      teamspaceIcon: row.teamspace.icon,
      workspaceId: row.teamspace.workspace.id,
      workspaceName: row.teamspace.workspace.name,
      inviterName: row.inviter?.username ?? null,
    }));
  }
}
