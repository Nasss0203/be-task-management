import { User } from 'src/modules/identity/identity.types';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkspaceOrmEntity } from './workspace.orm-entity';

@Entity('workspace_members')
@Index('UQ_workspace_members_workspace_user', ['workspaceId', 'userId'], {
  unique: true,
})
@Index('IDX_workspace_members_user_id', ['userId'])
@Index('IDX_workspace_members_workspace_id', ['workspaceId'])
export class WorkspaceMemberOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => WorkspaceOrmEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'workspace_id' })
  workspace: WorkspaceOrmEntity;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'role_name',
    type: 'enum',
    enum: WorkspaceRole,
    enumName: 'workspace_members_role_name_enum',
    default: WorkspaceRole.MEMBER,
  })
  roleName: WorkspaceRole;

  @CreateDateColumn({ type: 'timestamptz', name: 'joined_at' })
  joinedAt: Date;

  @Column({ type: 'timestamptz', name: 'last_opened_at', nullable: true })
  lastOpenedAt: Date | null;
}
