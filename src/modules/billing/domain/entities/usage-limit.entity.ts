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
import { Plan } from './plan.entity';

export enum UsageResourceType {
  MEMBERS = 'MEMBERS',
  PROJECTS = 'PROJECTS',
  TASKS = 'TASKS',
  PAGES = 'PAGES',
  PAGE_TEMPLATES = 'PAGE_TEMPLATES',
  STORAGE_MB = 'STORAGE_MB',
  ATTACHMENTS = 'ATTACHMENTS',
  SPRINTS = 'SPRINTS',
}

@Entity('usage_limits')
@Index(['workspaceId', 'resourceType'], { unique: true })
@Index(['planId'])
export class UsageLimit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @ManyToOne(() => Workspace, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;

  @Column({ name: 'plan_id', type: 'uuid', nullable: true })
  planId: string | null;

  @ManyToOne(() => Plan, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan | null;

  @Column({
    name: 'resource_type',
    type: 'enum',
    enum: UsageResourceType,
  })
  resourceType: UsageResourceType;

  @Column({ name: 'limit_value', type: 'int', nullable: true })
  limitValue: number | null;

  @Column({ name: 'used_value', type: 'int', default: 0 })
  usedValue: number;

  @Column({ name: 'reset_at', type: 'timestamp', nullable: true })
  resetAt: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
