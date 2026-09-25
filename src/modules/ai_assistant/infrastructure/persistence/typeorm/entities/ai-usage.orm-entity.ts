import { User } from 'src/modules/identity/identity.types';
import { WorkspaceOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace.orm-entity';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { AiConversationOrmEntity } from './ai-conversation.orm-entity';
import { AiGenerationOrmEntity } from './ai-generation.orm-entity';

@Entity('ai_usage')
@Index('IDX_ai_usage_user_id', ['userId'])
@Index('IDX_ai_usage_workspace_id', ['workspaceId'])
@Index('IDX_ai_usage_generation_id', ['generationId'])
@Index('IDX_ai_usage_conversation_id', ['conversationId'])
@Index('IDX_ai_usage_created_at', ['createdAt'])
@Index('IDX_ai_usage_user_created_at', ['userId', 'createdAt'])
@Index('IDX_ai_usage_workspace_created_at', ['workspaceId', 'createdAt'])
@Index('IDX_ai_usage_model_created_at', ['model', 'createdAt'])
@Check('CHK_ai_usage_prompt_tokens_non_negative', '"prompt_tokens" >= 0')
@Check(
  'CHK_ai_usage_completion_tokens_non_negative',
  '"completion_tokens" >= 0',
)
@Check('CHK_ai_usage_total_tokens_non_negative', '"total_tokens" >= 0')
@Check(
  'CHK_ai_usage_estimated_cost_non_negative',
  '"estimated_cost" IS NULL OR "estimated_cost" >= 0',
)
export class AiUsageOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  workspaceId: string | null;

  @ManyToOne(() => WorkspaceOrmEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'workspace_id' })
  workspace: WorkspaceOrmEntity | null;

  @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
  conversationId: string | null;

  @ManyToOne(
    () => AiConversationOrmEntity,
    (conversation) => conversation.usageRecords,
    { nullable: true, onDelete: 'SET NULL' },
  )
  @JoinColumn({ name: 'conversation_id' })
  conversation: AiConversationOrmEntity | null;

  @Column({ name: 'generation_id', type: 'uuid', nullable: true })
  generationId: string | null;

  @ManyToOne(
    () => AiGenerationOrmEntity,
    (generation) => generation.usageRecords,
    { nullable: true, onDelete: 'SET NULL' },
  )
  @JoinColumn({ name: 'generation_id' })
  generation: AiGenerationOrmEntity | null;

  @Column({ type: 'varchar', length: 100 })
  provider: string;

  @Column({ type: 'varchar', length: 255 })
  model: string;

  @Column({ name: 'prompt_tokens', type: 'integer', default: 0 })
  promptTokens: number;

  @Column({ name: 'completion_tokens', type: 'integer', default: 0 })
  completionTokens: number;

  @Column({ name: 'total_tokens', type: 'integer', default: 0 })
  totalTokens: number;

  @Column({
    name: 'estimated_cost',
    type: 'numeric',
    precision: 18,
    scale: 8,
    nullable: true,
  })
  estimatedCost: string | null;

  @Column({ type: 'varchar', length: 3, nullable: true })
  currency: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
