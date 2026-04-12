import { User } from 'src/modules/users/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('user_workspaces')
@Index('UQ_user_workspaces_workspace_user', ['workspace_id', 'user_id'], {
  unique: true,
})
@Index('IDX_user_workspaces_user_id', ['user_id'])
@Index('IDX_user_workspaces_workspace_id', ['workspace_id'])
export class UserWorkspace {
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

  @CreateDateColumn({ type: 'timestamptz', name: 'joined_at' })
  joinedAt: Date;

  @Column({ type: 'timestamptz', name: 'last_opened_at', nullable: true })
  lastOpenedAt: Date | null;
}
