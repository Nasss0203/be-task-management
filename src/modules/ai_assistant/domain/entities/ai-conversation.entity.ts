import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AiGeneration } from './ai-generation.entity';
import { AiMessage } from './ai-message.entity';

@Entity('ai_conversations')
@Index(['userId'])
@Index(['workspaceId'])
@Index(['lastMessageAt'])
export class AiConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'workspace_id', type: 'uuid', nullable: true })
  workspaceId: string | null;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  lastMessageAt: Date | null;

  @OneToMany(() => AiMessage, (message) => message.conversation)
  messages: AiMessage[];

  @OneToMany(() => AiGeneration, (generation) => generation.conversation)
  generations: AiGeneration[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
