// src/modules/audit_logs/domain/entities/audit-log.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AuditLogEntityType {
  WORKSPACE = 'WORKSPACE',
  PROJECT = 'PROJECT',
  TASK = 'TASK',
  SPRINT = 'SPRINT',
  COMMENT = 'COMMENT',
  ATTACHMENT = 'ATTACHMENT',
  PAGE = 'PAGE',
  PAGE_BLOCK = 'PAGE_BLOCK',
  USER = 'USER',
  ROLE = 'ROLE',
  PERMISSION = 'PERMISSION',
  BILLING = 'BILLING',
  SYSTEM = 'SYSTEM',
}

@Entity('audit_logs')
@Index(['workspaceId'])
@Index(['actorId'])
@Index(['entityType', 'entityId'])
@Index(['action'])
@Index(['requestId'])
@Index(['createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  workspaceId: string | null;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 150 })
  action: string;

  @Column({
    name: 'entity_type',
    type: 'enum',
    enum: AuditLogEntityType,
    nullable: true,
  })
  entityType: AuditLogEntityType | null;

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId: string | null;

  @Column({ name: 'before_value', type: 'jsonb', nullable: true })
  beforeValue: Record<string, unknown> | null;

  @Column({ name: 'after_value', type: 'jsonb', nullable: true })
  afterValue: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 100, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'request_id', type: 'varchar', length: 100, nullable: true })
  requestId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
