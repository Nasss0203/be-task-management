import { User } from 'src/modules/users/domain/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { WorkspaceRole } from 'src/shared/domain/enums/workspace-role.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('workspace_members')
@Index('UQ_workspace_members_workspace_user', ['workspace_id', 'user_id'], {
  unique: true,
})
@Index('IDX_workspace_members_user_id', ['user_id'])
@Index('IDX_workspace_members_workspace_id', ['workspace_id'])
export class WorkspaceMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workspace_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

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
  role_name: WorkspaceRole;

  @CreateDateColumn({ type: 'timestamptz', name: 'joined_at' })
  joinedAt: Date;

  @Column({ type: 'timestamptz', name: 'last_opened_at', nullable: true })
  lastOpenedAt: Date | null;
}
