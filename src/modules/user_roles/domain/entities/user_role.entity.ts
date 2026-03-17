import { Role } from 'src/modules/role/domain/entities/role.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity('user_roles')
@Index(['workspace_id', 'user_id'])
export class UserRole {
  @PrimaryColumn('uuid', { name: 'user_id' })
  user_id: string;

  @PrimaryColumn('uuid', { name: 'workspace_id' })
  workspace_id: string;

  @PrimaryColumn('uuid', { name: 'role_id' })
  role_id: string;

  @Column({
    name: 'assigned_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  assigned_at: Date;

  @Column({ name: 'assigned_by', type: 'uuid', nullable: true })
  assigned_by?: string | null;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revoked_at?: Date | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Workspace, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;
}
