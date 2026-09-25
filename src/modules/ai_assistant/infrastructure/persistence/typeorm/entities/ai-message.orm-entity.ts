import { AiMessageRole } from 'src/modules/ai_assistant/domain/enums/ai-message-role.enum';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { AiConversationOrmEntity } from './ai-conversation.orm-entity';

@Entity('ai_messages')
@Index('IDX_ai_messages_conversation_id', ['conversationId'])
@Index('IDX_ai_messages_conversation_created_at', [
  'conversationId',
  'createdAt',
])
export class AiMessageOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId: string;

  @ManyToOne(
    () => AiConversationOrmEntity,
    (conversation) => conversation.messages,
    { nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'conversation_id' })
  conversation: AiConversationOrmEntity;

  @Column({
    type: 'enum',
    enum: AiMessageRole,
    enumName: 'ai_messages_role_enum',
  })
  role: AiMessageRole;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
