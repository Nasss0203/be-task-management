import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionModule } from '../permission/permission.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksModule } from '../tasks/tasks.module';
import { ApplyAiGenerationApplicationImpl } from './applications/apply-ai-generation.application';
import { CreateAiConversationApplicationImpl } from './applications/create-ai-conversation.application';
import { DiscardAiGenerationApplicationImpl } from './applications/discard-ai-generation.application';
import { GetAiConversationApplicationImpl } from './applications/get-ai-conversation.application';
import { ListAiConversationsApplicationImpl } from './applications/list-ai-conversations.application';
import { SendAiMessageApplicationImpl } from './applications/send-ai-message.application';
import { AiAssistantController } from './controller/ai_assistant.controller';
import { AiConversation } from './domain/entities/ai-conversation.entity';
import { AiGeneration } from './domain/entities/ai-generation.entity';
import { AiMessage } from './domain/entities/ai-message.entity';
import { AI_ASSISTANT_TYPES } from './interfaces/types';
import { AiContextSnapshotRepositoryImpl } from './repositories/ai-context-snapshot.repository';
import { AiConversationRepositoryImpl } from './repositories/ai-conversation.repository';
import { AiGenerationRepositoryImpl } from './repositories/ai-generation.repository';
import { AiMessageRepositoryImpl } from './repositories/ai-message.repository';
import { AiConversationServiceImpl } from './services/ai-conversation.service';
import { AiGenerationServiceImpl } from './services/ai-generation.service';
import { AiMessageServiceImpl } from './services/ai-message.service';
import { GeminiAiService } from './services/gemini-ai.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiConversation, AiMessage, AiGeneration]),
    PermissionModule,
    WorkspacesModule,
    ProjectsModule,
    TasksModule,
  ],
  controllers: [AiAssistantController],
  providers: [
    {
      provide: AI_ASSISTANT_TYPES.repositories.AiConversationRepository,
      useClass: AiConversationRepositoryImpl,
    },
    {
      provide: AI_ASSISTANT_TYPES.repositories.AiMessageRepository,
      useClass: AiMessageRepositoryImpl,
    },
    {
      provide: AI_ASSISTANT_TYPES.repositories.AiGenerationRepository,
      useClass: AiGenerationRepositoryImpl,
    },
    {
      provide: AI_ASSISTANT_TYPES.repositories.AiContextSnapshotRepository,
      useClass: AiContextSnapshotRepositoryImpl,
    },
    {
      provide: AI_ASSISTANT_TYPES.services.AiConversationService,
      useClass: AiConversationServiceImpl,
    },
    {
      provide: AI_ASSISTANT_TYPES.services.AiMessageService,
      useClass: AiMessageServiceImpl,
    },
    {
      provide: AI_ASSISTANT_TYPES.services.AiGenerationService,
      useClass: AiGenerationServiceImpl,
    },
    {
      provide: AI_ASSISTANT_TYPES.services.AiProviderService,
      useClass: GeminiAiService,
    },
    {
      provide: AI_ASSISTANT_TYPES.applications.CreateAiConversationApplication,
      useClass: CreateAiConversationApplicationImpl,
    },
    {
      provide: AI_ASSISTANT_TYPES.applications.ListAiConversationsApplication,
      useClass: ListAiConversationsApplicationImpl,
    },
    {
      provide: AI_ASSISTANT_TYPES.applications.GetAiConversationApplication,
      useClass: GetAiConversationApplicationImpl,
    },
    {
      provide: AI_ASSISTANT_TYPES.applications.SendAiMessageApplication,
      useClass: SendAiMessageApplicationImpl,
    },
    {
      provide: AI_ASSISTANT_TYPES.applications.ApplyAiGenerationApplication,
      useClass: ApplyAiGenerationApplicationImpl,
    },
    {
      provide: AI_ASSISTANT_TYPES.applications.DiscardAiGenerationApplication,
      useClass: DiscardAiGenerationApplicationImpl,
    },
  ],
  exports: [
    AI_ASSISTANT_TYPES.services.AiConversationService,
    AI_ASSISTANT_TYPES.services.AiMessageService,
    AI_ASSISTANT_TYPES.services.AiGenerationService,
    AI_ASSISTANT_TYPES.services.AiProviderService,
  ],
})
export class AiAssistantModule {}
