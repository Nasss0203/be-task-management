import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import {
  ActivityEntityType,
  ActivityAction,
} from '../../../../domain/entities/activity.entity';

@Entity('activities')
@Index(['workspaceId', 'entityType', 'entityId'])
@Index(['workspaceId', 'projectId'])
@Index(['workspaceId', 'createdAt'])
@Index(['actorId'])
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string | null;

  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: ActivityEntityType,
  })
  entityType: ActivityEntityType;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({
    name: 'action',
    type: 'enum',
    enum: ActivityAction,
  })
  action: ActivityAction;

  @Column({ name: 'field', type: 'varchar', length: 100, nullable: true })
  field: string | null;

  @Column({ name: 'old_value', type: 'jsonb', nullable: true })
  oldValue: unknown;

  @Column({ name: 'new_value', type: 'jsonb', nullable: true })
  newValue: unknown;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
