import { AiToolCallStatus } from 'src/modules/ai_assistant/domain/enums/ai-tool-call-status.enum';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AiGenerationOrmEntity } from './ai-generation.orm-entity';

@Entity('ai_tool_calls')
@Index('IDX_ai_tool_calls_generation_id', ['generationId'])
@Index('IDX_ai_tool_calls_tool_name', ['toolName'])
@Index('IDX_ai_tool_calls_status', ['status'])
@Index('IDX_ai_tool_calls_generation_created_at', ['generationId', 'createdAt'])
@Check(
  'CHK_ai_tool_calls_duration_ms_non_negative',
  '"duration_ms" IS NULL OR "duration_ms" >= 0',
)
export class AiToolCallOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ name: 'generation_id', type: 'uuid' })
  generationId: string;

  @ManyToOne(
    () => AiGenerationOrmEntity,
    (generation) => generation.toolCalls,
    { nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'generation_id' })
  generation: AiGenerationOrmEntity;

  @Column({ name: 'tool_name', type: 'varchar', length: 255 })
  toolName: string;

  @Column({
    type: 'enum',
    enum: AiToolCallStatus,
    enumName: 'ai_tool_calls_status_enum',
    default: AiToolCallStatus.PENDING,
  })
  status: AiToolCallStatus;

  @Column({ type: 'jsonb', nullable: true })
  arguments: Record<string, unknown> | null;

  @Column({ name: 'result_metadata', type: 'jsonb', nullable: true })
  resultMetadata: Record<string, unknown> | null;

  @Column({ name: 'duration_ms', type: 'integer', nullable: true })
  durationMs: number | null;

  @Column({ name: 'error_code', type: 'varchar', length: 100, nullable: true })
  errorCode: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
