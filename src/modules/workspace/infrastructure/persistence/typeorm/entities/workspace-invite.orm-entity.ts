import { User } from 'src/modules/identity/identity.types';
import { WorkspaceRole } from 'src/modules/workspace/domain/enums/workspace-role.enum';
import { WorkspaceInviteStatus } from 'src/modules/workspace/domain/enums/workspace-invite-status.enum';
import { WorkspaceInviteType } from 'src/modules/workspace/domain/enums/workspace-invite-type.enum';
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
import { WorkspaceOrmEntity } from './workspace.orm-entity';

@Entity('workspace_invites')
@Index('UQ_workspace_invites_token', ['token'], { unique: true })
@Index('IDX_workspace_invites_workspace_id', ['workspaceId'])
@Index('IDX_workspace_invites_email', ['email'])
@Index('IDX_workspace_invites_status', ['status'])
@Index('IDX_workspace_invites_invited_by', ['invitedBy'])
@Index('IDX_workspace_invites_user_id', ['userId'])
@Index('IDX_workspace_invites_type', ['type'])
export class WorkspaceInviteOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @ManyToOne(() => WorkspaceOrmEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: WorkspaceOrmEntity;

  /**
   * Với EMAIL invite:
   * - có thể null lúc tạo nếu user chưa tồn tại trong hệ thống
   * - có thể set sau khi accept
   *
   * Với LINK invite:
   * - thường null
   * - có thể không cần dùng field này
   */
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

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

  @Column({
    name: 'role_name',
    type: 'enum',
    enum: WorkspaceRole,
    enumName: 'workspace_invites_role_name_enum',
    default: WorkspaceRole.MEMBER,
  })
  roleName: WorkspaceRole;

  @Column({ name: 'invited_by', type: 'uuid' })
  invitedBy: string;

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
  @Column({ name: 'accepted_at', type: 'timestamp', nullable: true })
  acceptedAt: Date | null;

  /**
   * Link/email hết hạn khi quá thời gian này
   */
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  /**
   * EMAIL invite: thường là 1
   * LINK invite: có thể null hoặc nhiều lần
   */
  @Column({ name: 'max_uses', type: 'int', nullable: true })
  maxUses: number | null;

  /**
   * Số lần đã dùng link
   */
  @Column({ name: 'used_count', type: 'int', default: 0 })
  usedCount: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
