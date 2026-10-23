import { User } from 'src/modules/identity/identity.types';
import { TeamspaceInvitationStatus } from 'src/modules/teamspace/domain/enums/teamspace-invitation-status.enum';
import { WorkspaceMemberOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace-member.orm-entity';
import {
  Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne,
  PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { TeamspaceOrmEntity } from './teamspace.orm-entity';

@Entity('teamspace_invitations')
@Index('IDX_teamspace_invitations_recipient', ['workspaceMemberId', 'createdAt'])
@Index('UQ_teamspace_invitations_pending', ['teamspaceId', 'workspaceMemberId'], {
  unique: true,
  where: "status = 'PENDING'",
})
@Check('CHK_teamspace_invitations_status', `"status" IN ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED')`)
export class TeamspaceInvitationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'teamspace_id', type: 'uuid' })
  teamspaceId: string;

  @ManyToOne(() => TeamspaceOrmEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamspace_id', foreignKeyConstraintName: 'FK_teamspace_invitations_teamspace' })
  teamspace: TeamspaceOrmEntity;

  @Column({ name: 'workspace_member_id', type: 'uuid' })
  workspaceMemberId: string;

  @ManyToOne(() => WorkspaceMemberOrmEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_member_id', foreignKeyConstraintName: 'FK_teamspace_invitations_recipient' })
  workspaceMember: WorkspaceMemberOrmEntity;

  @Column({ name: 'invited_by', type: 'uuid', nullable: true })
  invitedBy: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invited_by', foreignKeyConstraintName: 'FK_teamspace_invitations_inviter' })
  inviter: User | null;

  @Column({ type: 'varchar', length: 16, default: TeamspaceInvitationStatus.PENDING })
  status: TeamspaceInvitationStatus;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
