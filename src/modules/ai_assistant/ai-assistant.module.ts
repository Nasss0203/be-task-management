import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from 'src/database/database.module';
import { PermissionModule } from 'src/modules/permission/permission.module';
import { AI_ASSISTANT_TYPES } from './ai-assistant.types';
import { AddMessageHandler } from './application/commands/add-message/add-message.handler';
import { ApplyGenerationHandler } from './application/commands/apply-generation/apply-generation.handler';
import { ArchiveConversationHandler } from './application/commands/archive-conversation/archive-conversation.handler';
import { CompleteGenerationHandler } from './application/commands/complete-generation/complete-generation.handler';
import { CompleteToolCallHandler } from './application/commands/complete-tool-call/complete-tool-call.handler';
import { CreateConversationHandler } from './application/commands/create-conversation/create-conversation.handler';
import { CreateGenerationHandler } from './application/commands/create-generation/create-generation.handler';
import { CreateToolCallHandler } from './application/commands/create-tool-call/create-tool-call.handler';
import { DiscardGenerationHandler } from './application/commands/discard-generation/discard-generation.handler';
import { FailGenerationHandler } from './application/commands/fail-generation/fail-generation.handler';
import { RecordAiUsageHandler } from './application/commands/record-ai-usage/record-ai-usage.handler';
import { StartToolCallHandler } from './application/commands/start-tool-call/start-tool-call.handler';
import { GetAiUsageSummaryHandler } from './application/queries/get-ai-usage-summary/get-ai-usage-summary.handler';
import { GetConversationHandler } from './application/queries/get-conversation/get-conversation.handler';
import { GetGenerationHandler } from './application/queries/get-generation/get-generation.handler';
import { ListConversationMessagesHandler } from './application/queries/list-conversation-messages/list-conversation-messages.handler';
import { ListConversationsHandler } from './application/queries/list-conversations/list-conversations.handler';
import { AiAssistantService } from './application/services/ai-assistant.service';
import { AiConversationOrmEntity } from './infrastructure/persistence/typeorm/entities/ai-conversation.orm-entity';
import { AiGenerationOrmEntity } from './infrastructure/persistence/typeorm/entities/ai-generation.orm-entity';
import { AiMessageOrmEntity } from './infrastructure/persistence/typeorm/entities/ai-message.orm-entity';
import { AiToolCallOrmEntity } from './infrastructure/persistence/typeorm/entities/ai-tool-call.orm-entity';
import { AiUsageOrmEntity } from './infrastructure/persistence/typeorm/entities/ai-usage.orm-entity';
import { TypeOrmAiConversationRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-ai-conversation.repository';
import { TypeOrmAiGenerationRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-ai-generation.repository';
import { TypeOrmAiMessageRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-ai-message.repository';
import { TypeOrmAiToolCallRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-ai-tool-call.repository';
import { TypeOrmAiUsageRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-ai-usage.repository';
import { FastApiAiRuntimeAdapter } from './infrastructure/runtime/fast-api-ai-runtime.adapter';
import { AiAssistantController } from './presentation/http/controllers/ai-assistant.controller';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      AiConversationOrmEntity,
      AiMessageOrmEntity,
      AiGenerationOrmEntity,
      AiUsageOrmEntity,
      AiToolCallOrmEntity,
    ]),
    DatabaseModule,
    PermissionModule,
  ],
  controllers: [AiAssistantController],
  providers: [
    CreateConversationHandler,
    ArchiveConversationHandler,
    AddMessageHandler,
    CreateGenerationHandler,
    CompleteGenerationHandler,
    FailGenerationHandler,
    ApplyGenerationHandler,
    DiscardGenerationHandler,
    RecordAiUsageHandler,
    CreateToolCallHandler,
    StartToolCallHandler,
    CompleteToolCallHandler,
    ListConversationsHandler,
    GetConversationHandler,
    ListConversationMessagesHandler,
    GetGenerationHandler,
    GetAiUsageSummaryHandler,
    AiAssistantService,
    {
      provide: AI_ASSISTANT_TYPES.repositories.AiConversationRepository,
      useClass: TypeOrmAiConversationRepository,
    },
    {
      provide: AI_ASSISTANT_TYPES.repositories.AiMessageRepository,
      useClass: TypeOrmAiMessageRepository,
    },
    {
      provide: AI_ASSISTANT_TYPES.repositories.AiGenerationRepository,
      useClass: TypeOrmAiGenerationRepository,
    },
    {
      provide: AI_ASSISTANT_TYPES.repositories.AiUsageRepository,
      useClass: TypeOrmAiUsageRepository,
    },
    {
      provide: AI_ASSISTANT_TYPES.repositories.AiToolCallRepository,
      useClass: TypeOrmAiToolCallRepository,
    },
    {
      provide: AI_ASSISTANT_TYPES.runtime.AiRuntime,
      useClass: FastApiAiRuntimeAdapter,
    },
  ],
})
export class AiAssistantModule {}
