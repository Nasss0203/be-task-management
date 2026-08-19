import { WorkspaceMember } from 'src/modules/workspace_member/domain/entities/workspace-member.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PlanTypeWorkspace {
  FREE = 'free',
  PRO = 'pro',
}

export enum WorkspaceLayoutMode {
  TABS = 'tabs',
  BLOCKS = 'blocks',
}

@Entity('workspaces')
@Index('IDX_WORKSPACES_DELETED_AT', ['deletedAt'])
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({
    type: 'enum',
    enum: PlanTypeWorkspace,
    default: PlanTypeWorkspace.FREE,
    name: 'plan_type',
  })
  planType: PlanTypeWorkspace;

  @Column({
    type: 'enum',
    enum: WorkspaceLayoutMode,
    default: WorkspaceLayoutMode.TABS,
    name: 'layout_mode',
  })
  layoutMode: WorkspaceLayoutMode;

  @OneToMany(
    () => WorkspaceMember,
    (workspaceMember) => workspaceMember.workspace,
  )
  workspaceMembers: WorkspaceMember[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date | null;

  @Column({ name: 'deleted_by', type: 'uuid', nullable: true })
  deletedBy: string | null;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy: string | null;
}
