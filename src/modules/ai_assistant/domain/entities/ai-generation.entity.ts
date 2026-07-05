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
import { AiAppliedResult } from '../../interfaces/types/ai-applied-result.type';
import { AiGenerationStatus } from '../enums/ai-generation-status.enum';
import { AiGenerationType } from '../enums/ai-generation-type.enum';
import { AiProvider } from '../enums/ai-provider.enum';
import { AiConversation } from './ai-conversation.entity';

@Entity('ai_generations')
@Index(['userId'])
@Index(['conversationId'])
@Index(['workspaceId'])
@Index(['projectId'])
@Index(['boardId'])
@Index(['sprintId'])
@Index(['status'])
export class AiGeneration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => AiConversation, (conversation) => conversation.generations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation: AiConversation;

  @Column({ name: 'request_message_id', type: 'uuid', nullable: true })
  requestMessageId: string | null;

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  workspaceId: string | null;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId: string | null;

  @Column({ name: 'board_id', type: 'uuid', nullable: true })
  boardId: string | null;

  @Column({ name: 'sprint_id', type: 'uuid', nullable: true })
  sprintId: string | null;

  @Column({
    name: 'generation_type',
    type: 'enum',
    enum: AiGenerationType,
    enumName: 'ai_generation_type_enum',
  })
  generationType: AiGenerationType;

  @Column({ name: 'input_text', type: 'text' })
  inputText: string;

  @Column({ name: 'input_context', type: 'jsonb', nullable: true })
  inputContext: Record<string, unknown> | null;

  @Column({ name: 'output_data', type: 'jsonb', nullable: true })
  outputData: Record<string, unknown> | null;

  @Column({
    type: 'enum',
    enum: AiProvider,
    enumName: 'ai_provider_enum',
  })
  provider: AiProvider;

  @Column({ type: 'varchar', length: 120 })
  model: string;

  @Column({
    type: 'enum',
    enum: AiGenerationStatus,
    enumName: 'ai_generation_status_enum',
    default: AiGenerationStatus.PROCESSING,
  })
  status: AiGenerationStatus;

  @Column({ name: 'applied_results', type: 'jsonb', nullable: true })
  appliedResults: AiAppliedResult[] | null;

  @Column({ name: 'input_tokens', type: 'int', nullable: true })
  inputTokens: number | null;

  @Column({ name: 'output_tokens', type: 'int', nullable: true })
  outputTokens: number | null;

  @Column({ name: 'total_tokens', type: 'int', nullable: true })
  totalTokens: number | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'applied_at', type: 'timestamp', nullable: true })
  appliedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
