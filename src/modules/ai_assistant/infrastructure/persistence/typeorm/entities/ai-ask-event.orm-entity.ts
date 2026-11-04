import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import type { AiAskEventFlags } from 'src/modules/ai_assistant/application/ask-log/ai-ask-event';

/**
 * Kế hoạch ghi log Ask (L1): one row per Ask and per Undo, codes and counts
 * only, for the real-user evaluation. No foreign keys: a row outlives the
 * conversation or draft it describes. `instruction` is set only when
 * AI_ASK_LOG_TEXT=true and cleared after 30 days (L2a, L8).
 */
@Entity('ai_ask_events')
@Index('IDX_ai_ask_events_workspace_created_at', ['workspaceId', 'createdAt'])
@Index('IDX_ai_ask_events_created_at', ['createdAt'])
export class AiAskEventOrmEntity {
  @PrimaryGeneratedColumn('uuid', {
    primaryKeyConstraintName: 'PK_ai_ask_events',
  })
  id: string;

  @Column({ type: 'varchar', length: 20 })
  kind: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'workspace_id', type: 'uuid' })
  workspaceId: string;

  @Column({ name: 'request_id', type: 'varchar', length: 100, nullable: true })
  requestId: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  intent: string | null;

  @Column({ type: 'varchar', length: 40 })
  status: string;

  @Column({ type: 'varchar', length: 60, nullable: true })
  reason: string | null;

  @Column({
    name: 'reference_type',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  referenceType: string | null;

  @Column({
    name: 'resolution_method',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  resolutionMethod: string | null;

  @Column({ name: 'candidate_count', type: 'smallint', nullable: true })
  candidateCount: number | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  flags: AiAskEventFlags;

  @Column({ type: 'varchar', length: 80, nullable: true })
  capability: string | null;

  @Column({ name: 'generation_id', type: 'uuid', nullable: true })
  generationId: string | null;

  @Column({ name: 'duration_ms', type: 'integer' })
  durationMs: number;

  @Column({ name: 'error_code', type: 'varchar', length: 40, nullable: true })
  errorCode: string | null;

  @Column({ type: 'varchar', length: 300, nullable: true })
  instruction: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
