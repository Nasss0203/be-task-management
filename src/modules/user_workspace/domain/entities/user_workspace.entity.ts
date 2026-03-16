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
@Index('UQ_user_workspaces', ['workspace_id', 'user_id'], { unique: true })
export class UserWorkspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workspace_id: string;

  @Column('uuid')
  user_id: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  // Lần gần nhất user mở workspace (tự update bằng service)
  @Column({ type: 'timestamp', name: 'last_opened_at', nullable: true })
  lastOpenedAt: Date | null;
}
