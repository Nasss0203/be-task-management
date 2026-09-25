import { AiGenerationStatus } from 'src/modules/ai_assistant/domain/enums/ai-generation-status.enum';
import { User } from 'src/modules/identity/identity.types';
import { WorkspaceOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace.orm-entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AiConversationOrmEntity } from './ai-conversation.orm-entity';
import { AiToolCallOrmEntity } from './ai-tool-call.orm-entity';
import { AiUsageOrmEntity } from './ai-usage.orm-entity';

@Entity('ai_generations')
@Index('IDX_ai_generations_conversation_id', ['conversationId'])
@Index('IDX_ai_generations_user_id', ['userId'])
@Index('IDX_ai_generations_workspace_id', ['workspaceId'])
@Index('IDX_ai_generations_status', ['status'])
@Index('IDX_ai_generations_created_at', ['createdAt'])
@Index('IDX_ai_generations_user_created_at', ['userId', 'createdAt'])
@Index('IDX_ai_generations_workspace_created_at', ['workspaceId', 'createdAt'])
@Index('IDX_ai_generations_conversation_created_at', [
  'conversationId',
  'createdAt',
])
export class AiGenerationOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
  conversationId: string | null;

  @ManyToOne(
    () => AiConversationOrmEntity,
    (conversation) => conversation.generations,
    { nullable: true, onDelete: 'SET NULL' },
  )
  @JoinColumn({ name: 'conversation_id' })
  conversation: AiConversationOrmEntity | null;

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

  @Column({ type: 'varchar', length: 100 })
  capability: string;

  @Column({
    type: 'enum',
    enum: AiGenerationStatus,
    enumName: 'ai_generations_status_enum',
    default: AiGenerationStatus.PROCESSING,
  })
  status: AiGenerationStatus;

  @Column({ name: 'input_data', type: 'jsonb', nullable: true })
  inputData: unknown;

  @Column({ name: 'output_data', type: 'jsonb', nullable: true })
  outputData: unknown;

  @Column({ type: 'varchar', length: 100, nullable: true })
  provider: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  model: string | null;

  @Column({ name: 'error_code', type: 'varchar', length: 100, nullable: true })
  errorCode: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'applied_at', type: 'timestamptz', nullable: true })
  appliedAt: Date | null;

  @OneToMany(() => AiUsageOrmEntity, (usage) => usage.generation)
  usageRecords: AiUsageOrmEntity[];

  @OneToMany(() => AiToolCallOrmEntity, (toolCall) => toolCall.generation)
  toolCalls: AiToolCallOrmEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
