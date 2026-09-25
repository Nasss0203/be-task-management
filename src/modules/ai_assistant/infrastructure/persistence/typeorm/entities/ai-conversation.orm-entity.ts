import { AiConversationStatus } from 'src/modules/ai_assistant/domain/enums/ai-conversation-status.enum';
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
import { AiGenerationOrmEntity } from './ai-generation.orm-entity';
import { AiMessageOrmEntity } from './ai-message.orm-entity';
import { AiUsageOrmEntity } from './ai-usage.orm-entity';

@Entity('ai_conversations')
@Index('IDX_ai_conversations_user_id', ['userId'])
@Index('IDX_ai_conversations_workspace_id', ['workspaceId'])
@Index('IDX_ai_conversations_created_at', ['createdAt'])
@Index('IDX_ai_conversations_user_created_at', ['userId', 'createdAt'])
@Index('IDX_ai_conversations_workspace_created_at', [
  'workspaceId',
  'createdAt',
])
export class AiConversationOrmEntity {
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

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({
    type: 'enum',
    enum: AiConversationStatus,
    enumName: 'ai_conversations_status_enum',
    default: AiConversationStatus.ACTIVE,
  })
  status: AiConversationStatus;

  @OneToMany(() => AiMessageOrmEntity, (message) => message.conversation)
  messages: AiMessageOrmEntity[];

  @OneToMany(
    () => AiGenerationOrmEntity,
    (generation) => generation.conversation,
  )
  generations: AiGenerationOrmEntity[];

  @OneToMany(() => AiUsageOrmEntity, (usage) => usage.conversation)
  usageRecords: AiUsageOrmEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
