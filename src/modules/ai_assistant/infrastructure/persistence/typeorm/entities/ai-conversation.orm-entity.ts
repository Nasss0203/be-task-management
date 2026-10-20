import { AiConversationStatus } from 'src/modules/ai_assistant/domain/enums/ai-conversation-status.enum';
import { AiConversationScope } from 'src/modules/ai_assistant/domain/enums/ai-conversation-scope.enum';
import { PageOrmEntity } from 'src/modules/content/infrastructure/persistence/typeorm/entities/page.orm-entity';
import { User } from 'src/modules/identity/identity.types';
import { WorkspaceOrmEntity } from 'src/modules/workspace/infrastructure/persistence/typeorm/entities/workspace.orm-entity';
import {
  Column,
  Check,
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
@Check(
  'CHK_ai_conversations_scope_page',
  `("scope" = 'PAGE' AND "page_id" IS NOT NULL) OR ("scope" IN ('GLOBAL', 'LEGACY') AND "page_id" IS NULL)`,
)
@Index('IDX_ai_conversations_user_workspace_scope_page_created', [
  'userId',
  'workspaceId',
  'scope',
  'pageId',
  'createdAt',
  'id',
])
@Index('IDX_ai_conversations_page_id', ['pageId'])
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

  @Column({
    type: 'enum',
    enum: AiConversationScope,
    default: AiConversationScope.LEGACY,
  })
  scope: AiConversationScope;

  @Column({ name: 'page_id', type: 'uuid', nullable: true })
  pageId: string | null;

  @ManyToOne(() => PageOrmEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'page_id',
    foreignKeyConstraintName: 'FK_ai_conversations_page_id',
  })
  page: PageOrmEntity | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  @Column({
    type: 'enum',
    enum: AiConversationStatus,
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
