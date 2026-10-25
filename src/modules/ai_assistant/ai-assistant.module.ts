import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DatabaseModule as CoreDatabaseModule } from 'src/database/database.module';
import { ContentModule } from 'src/modules/content/content.module';
import { DatabaseModule as BusinessDatabaseModule } from 'src/modules/database/database.module';
import { PermissionModule } from 'src/modules/permission/permission.module';

import { AI_ASSISTANT_TYPES } from './ai-assistant.types';

import { AddMessageHandler } from './application/commands/add-message/add-message.handler';
import { ApplyGenerationHandler } from './application/commands/apply-generation/apply-generation.handler';
import { ArchiveConversationHandler } from './application/commands/archive-conversation/archive-conversation.handler';
import { CompleteGenerationHandler } from './application/commands/complete-generation/complete-generation.handler';
import { CompleteToolCallHandler } from './application/commands/complete-tool-call/complete-tool-call.handler';
import { ConfirmPageCompositionHandler } from './application/commands/confirm-page-composition/confirm-page-composition.handler';
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
import { ListConversationGenerationsHandler } from './application/queries/list-conversation-generations/list-conversation-generations.handler';
import { ListConversationsHandler } from './application/queries/list-conversations/list-conversations.handler';

import { AiAssistantService } from './application/services/ai-assistant.service';
import { AiSubmitAuthorizationLock } from './application/services/ai-submit-authorization-lock.port';
import { AiSubmitAuthorizationLockService } from './infrastructure/persistence/typeorm/ai-submit-authorization-lock.service';
import { AiAskService } from './application/services/ai-ask.service';
import { AiConversationAccessService } from './application/services/ai-conversation-access.service';
import { PageCompositionDraftValidator } from './application/services/page-composition-draft-validator.service';
import { PageCompositionExecutor } from './application/services/page-composition-executor.service';
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
import { AiPageContextTransactionLockService } from './infrastructure/persistence/typeorm/ai-page-context-transaction-lock.service';

import { FastApiAiRuntimeAdapter } from './infrastructure/runtime/fast-api-ai-runtime.adapter';

import { AiAssistantController } from './presentation/http/controllers/ai-assistant.controller';

import { GetAiPageContextHandler } from './application/queries/get-ai-page-context/get-ai-page-context.handler';

import { AiModificationPlanValidatorService } from './application/services/ai-modification-plan-validator.service';
import { AiModificationPlanExecutor } from './application/services/ai-modification-plan-executor.service';
import { AiModificationPlannerService } from './application/services/ai-modification-planner.service';

import { ConfirmAiModificationPlanHandler } from './application/commands/confirm-ai-modification-plan/confirm-ai-modification-plan.handler';

import { ConfirmGenerationHandler } from './application/commands/confirm-generation/confirm-generation.handler';
import { PageReferenceResolver } from './application/resolution/page-reference-resolver.service';
import { PageExactResolutionReader } from './infrastructure/resolution/page-exact-resolution.reader';
import { PageIntentExtractionService } from './application/resolution/page-intent-extraction.service';
import { AiPageInstructionPlannerService } from './application/services/ai-page-instruction-planner.service';

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

    CoreDatabaseModule,
    ContentModule,
    BusinessDatabaseModule,
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
    ConfirmGenerationHandler,
    ConfirmPageCompositionHandler,
    ConfirmAiModificationPlanHandler,

    ListConversationsHandler,
    GetConversationHandler,
    ListConversationMessagesHandler,
    ListConversationGenerationsHandler,
    GetGenerationHandler,
    GetAiUsageSummaryHandler,
    GetAiPageContextHandler,
    PageReferenceResolver,
    PageIntentExtractionService,
    AiPageInstructionPlannerService,

    AiAssistantService,
    {
      provide: AiSubmitAuthorizationLock,
      useClass: AiSubmitAuthorizationLockService,
    },
    AiAskService,
    {
      provide: AI_ASSISTANT_TYPES.services.AiConversationAccess,
      useClass: AiConversationAccessService,
    },
    AiModificationPlannerService,
    AiModificationPlanValidatorService,
    AiModificationPlanExecutor,
    PageCompositionDraftValidator,
    PageCompositionExecutor,
    {
      provide: AI_ASSISTANT_TYPES.ports.PageResolutionReader,
      useClass: PageExactResolutionReader,
    },
    {
      provide: AI_ASSISTANT_TYPES.ports.PageIntentExtractor,
      useExisting: AI_ASSISTANT_TYPES.runtime.AiRuntime,
    },
    {
      provide: AI_ASSISTANT_TYPES.ports.AiIntent,
      useExisting: AI_ASSISTANT_TYPES.runtime.AiRuntime,
    },
    {
      provide: AI_ASSISTANT_TYPES.ports.PageContextTransactionLocker,
      useClass: AiPageContextTransactionLockService,
    },

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
