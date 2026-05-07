import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { User } from 'src/modules/users/domain/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
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

export enum WorkspaceInviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum WorkspaceInviteType {
  EMAIL = 'EMAIL',
  LINK = 'LINK',
}

@Entity('workspace_invites')
@Index('UQ_workspace_invites_token', ['token'], { unique: true })
@Index('IDX_workspace_invites_workspace_id', ['workspace_id'])
@Index('IDX_workspace_invites_email', ['email'])
@Index('IDX_workspace_invites_status', ['status'])
@Index('IDX_workspace_invites_invited_by', ['invited_by'])
@Index('IDX_workspace_invites_user_id', ['user_id'])
@Index('IDX_workspace_invites_type', ['type'])
export class WorkspaceInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workspace_id: string;

  @ManyToOne(() => Workspace, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  /**
   * Với EMAIL invite:
   * - có thể null lúc tạo nếu user chưa tồn tại trong hệ thống
   * - có thể set sau khi accept
   *
   * Với LINK invite:
   * - thường null
   * - có thể không cần dùng field này
   */
  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  /**
   * EMAIL invite: email người được mời
   * LINK invite: null
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({
    type: 'enum',
    enum: WorkspaceInviteType,
    default: WorkspaceInviteType.EMAIL,
  })
  type: WorkspaceInviteType;

  @Column({ type: 'enum', enum: RoleName, default: RoleName.MEMBER })
  role_name: RoleName;

  @Column({ type: 'uuid' })
  invited_by: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invited_by' })
  inviter: User;

  @Column({ type: 'varchar', length: 255 })
  token: string;

  @Column({
    type: 'enum',
    enum: WorkspaceInviteStatus,
    default: WorkspaceInviteStatus.PENDING,
  })
  status: WorkspaceInviteStatus;

  /**
   * EMAIL invite: set khi người được mời accept
   * LINK invite:
   * - nếu max_uses = 1 thì có thể set khi accept
   * - nếu link dùng nhiều lần thì không nên dựa vào accepted_at
   */
  @Column({ type: 'timestamp', nullable: true })
  accepted_at: Date | null;

  /**
   * Link/email hết hạn khi quá thời gian này
   */
  @Column({ type: 'timestamp' })
  expires_at: Date;

  /**
   * EMAIL invite: thường là 1
   * LINK invite: có thể null hoặc nhiều lần
   */
  @Column({ type: 'int', nullable: true })
  max_uses: number | null;

  /**
   * Số lần đã dùng link
   */
  @Column({ type: 'int', default: 0 })
  used_count: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
