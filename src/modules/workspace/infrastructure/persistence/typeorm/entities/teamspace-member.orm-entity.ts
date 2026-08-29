import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TeamspaceRole } from '../../../../domain/enums/teamspace-role.enum';
import { TeamspaceOrmEntity } from './teamspace.orm-entity';
import { WorkspaceMemberOrmEntity } from './workspace-member.orm-entity';

@Entity('teamspace_members')
@Index(
  'UQ_teamspace_members_teamspace_workspace_member',
  ['teamspaceId', 'workspaceMemberId'],
  {
    unique: true,
  },
)
@Index('IDX_teamspace_members_teamspace_id', ['teamspaceId'])
@Index('IDX_teamspace_members_workspace_member_id', ['workspaceMemberId'])
export class TeamspaceMemberOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'teamspace_id',
    type: 'uuid',
  })
  teamspaceId: string;

  @ManyToOne(() => TeamspaceOrmEntity, (teamspace) => teamspace.members, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'teamspace_id',
  })
  teamspace: TeamspaceOrmEntity;

  @Column({
    name: 'workspace_member_id',
    type: 'uuid',
  })
  workspaceMemberId: string;

  @ManyToOne(() => WorkspaceMemberOrmEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'workspace_member_id',
  })
  workspaceMember: WorkspaceMemberOrmEntity;

  @Column({
    name: 'role_name',
    type: 'enum',
    enum: TeamspaceRole,
    enumName: 'teamspace_members_role_name_enum',
    default: TeamspaceRole.MEMBER,
  })
  roleName: TeamspaceRole;

  @CreateDateColumn({
    name: 'joined_at',
    type: 'timestamptz',
  })
  joinedAt: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
  })
  updatedAt: Date;
}
