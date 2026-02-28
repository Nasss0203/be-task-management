import { Role } from 'src/modules/role/entities/role.entity';
import { Workspace } from 'src/modules/workspaces/entities/workspace.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('workspace_members')
@Index('UQ_workspace_member', ['workspace_id', 'user_id'], { unique: true })
export class WorkspaceMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  workspace_id: string;

  @Column('uuid')
  user_id: string;

  @Column('uuid')
  role_id: string;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  // user relation tuỳ bạn
}
