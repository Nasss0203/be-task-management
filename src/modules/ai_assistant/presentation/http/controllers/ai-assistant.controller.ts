import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import type { IAuth } from 'src/types/auth';

import { ArchiveConversationCommand } from '../../../application/commands/archive-conversation/archive-conversation.command';
import { ArchiveConversationHandler } from '../../../application/commands/archive-conversation/archive-conversation.handler';
import { ConfirmGenerationCommand } from '../../../application/commands/confirm-generation/confirm-generation.command';
import { ConfirmGenerationHandler } from '../../../application/commands/confirm-generation/confirm-generation.handler';

import { CreateConversationCommand } from '../../../application/commands/create-conversation/create-conversation.command';
import { CreateConversationHandler } from '../../../application/commands/create-conversation/create-conversation.handler';
import { DiscardGenerationCommand } from '../../../application/commands/discard-generation/discard-generation.command';
import { DiscardGenerationHandler } from '../../../application/commands/discard-generation/discard-generation.handler';

import { ConfirmPageCompositionRequestDto } from '../../../application/dto/request/confirm-page-composition.request.dto';
import { CreateAiConversationRequestDto } from '../../../application/dto/request/create-ai-conversation.request.dto';
import { GenerateAiModificationPlanRequestDto } from '../../../application/dto/request/generate-ai-modification-plan.request.dto';
import { GenerateAiPagePlanFromInstructionRequestDto } from '../../../application/dto/request/generate-ai-page-plan-from-instruction.request.dto';
import { ListAiConversationsRequestDto } from '../../../application/dto/request/list-ai-conversations.request.dto';
import { ListAiMessagesRequestDto } from '../../../application/dto/request/list-ai-messages.request.dto';
import { ListAiGenerationsRequestDto } from '../../../application/dto/request/list-ai-generations.request.dto';
import { SubmitAiMessageRequestDto } from '../../../application/dto/request/submit-ai-message.request.dto';
import { ResolveAiPageRequestDto } from '../../../application/dto/request/resolve-ai-page.request.dto';
import { ExtractAiPageIntentRequestDto } from '../../../application/dto/request/extract-ai-page-intent.request.dto';
import { PageReferenceResolver } from '../../../application/resolution/page-reference-resolver.service';
import { PageIntentExtractionService } from '../../../application/resolution/page-intent-extraction.service';

import { GetConversationHandler } from '../../../application/queries/get-conversation/get-conversation.handler';
import { GetConversationQuery } from '../../../application/queries/get-conversation/get-conversation.query';
import { GetGenerationHandler } from '../../../application/queries/get-generation/get-generation.handler';
import { GetGenerationQuery } from '../../../application/queries/get-generation/get-generation.query';
import { ListConversationMessagesHandler } from '../../../application/queries/list-conversation-messages/list-conversation-messages.handler';
import { ListConversationMessagesQuery } from '../../../application/queries/list-conversation-messages/list-conversation-messages.query';
import { ListConversationGenerationsHandler } from '../../../application/queries/list-conversation-generations/list-conversation-generations.handler';
import { ListConversationGenerationsQuery } from '../../../application/queries/list-conversation-generations/list-conversation-generations.query';
import { ListConversationsHandler } from '../../../application/queries/list-conversations/list-conversations.handler';
import { ListConversationsQuery } from '../../../application/queries/list-conversations/list-conversations.query';

import { AiAssistantService } from '../../../application/services/ai-assistant.service';
import { AiAskService } from '../../../application/services/ai-ask.service';
import { AskAiRequestDto } from '../../../application/dto/request/ask-ai.request.dto';
import { AiModificationPlannerService } from '../../../application/services/ai-modification-planner.service';
import { AiPageInstructionPlannerService } from '../../../application/services/ai-page-instruction-planner.service';

@Controller('ai-assistant')
@ReadRateLimit()
export class AiAssistantController {
  constructor(
    private readonly createConversationHandler: CreateConversationHandler,
    private readonly archiveConversationHandler: ArchiveConversationHandler,
    private readonly listConversationsHandler: ListConversationsHandler,
    private readonly getConversationHandler: GetConversationHandler,
    private readonly listConversationMessagesHandler: ListConversationMessagesHandler,
    private readonly listConversationGenerationsHandler: ListConversationGenerationsHandler,
    private readonly getGenerationHandler: GetGenerationHandler,
    private readonly confirmGenerationHandler: ConfirmGenerationHandler,
    private readonly aiAssistantService: AiAssistantService,
    private readonly discardGenerationHandler: DiscardGenerationHandler,
    private readonly aiModificationPlannerService: AiModificationPlannerService,
    private readonly pageReferenceResolver: PageReferenceResolver,
    private readonly pageIntentExtractionService: PageIntentExtractionService,
    private readonly aiPageInstructionPlannerService: AiPageInstructionPlannerService,
    private readonly aiAskService: AiAskService,
  ) {}

  @Post('ask')
  @WriteRateLimit()
  @ResponseMessage('AI request processed')
  ask(
    @Auth() auth: IAuth,
    @Body() dto: AskAiRequestDto,
    @Query('shareToken') shareToken?: string,
  ) {
    return this.aiAskService.ask({
      ...dto,
      userId: auth.id,
      requestId: dto.requestId ?? randomUUID(),
      shareToken,
    });
  }

  /**
   * Phase 3: extract natural-language target, resolve an authorized Page,
   * and create a preview draft. Changes are executed only via Confirm.
   */
  @Post('pages/modification-plan/from-instruction')
  @WriteRateLimit()
  @ResponseMessage('AI page instruction processed')
  generatePagePlanFromInstruction(
    @Auth() auth: IAuth,
    @Body() dto: GenerateAiPagePlanFromInstructionRequestDto,
    @Query('shareToken') shareToken?: string,
  ) {
    return this.aiPageInstructionPlannerService.generate({
      userId: auth.id,
      workspaceId: dto.workspaceId,
      instruction: dto.instruction,
      currentPageId: dto.currentPageId,
      selectedPageId: dto.selectedPageId,
      requestId: dto.requestId ?? randomUUID(),
      conversationId: dto.conversationId,
      shareToken,
    });
  }

  /** Phase 2: extract intent only; no resolution, generation or mutation. */
  @Post('pages/extract-intent')
  @WriteRateLimit()
  @ResponseMessage('AI page intent extracted')
  extractPageIntent(
    @Auth() _auth: IAuth,
    @Body() dto: ExtractAiPageIntentRequestDto,
  ) {
    return this.pageIntentExtractionService.extract(dto.instruction);
  }

  /** Read-only Phase 1 lookup. No generation or page changes are performed. */
  @Post('pages/resolve')
  @ResponseMessage('AI page reference resolved')
  resolvePage(
    @Auth() auth: IAuth,
    @Body() dto: ResolveAiPageRequestDto,
    @Query('shareToken') shareToken?: string,
  ) {
    return this.pageReferenceResolver.resolve({
      userId: auth.id,
      workspaceId: dto.workspaceId,
      title: dto.title,
      currentPageId: dto.currentPageId,
      shareToken,
    });
  }

  @Post('conversations')
  @WriteRateLimit()
  @ResponseMessage('AI conversation created')
  createConversation(
    @Auth() auth: IAuth,
    @Body() dto: CreateAiConversationRequestDto,
    @Query('shareToken') shareToken?: string,
  ) {
    return this.createConversationHandler.execute(
      new CreateConversationCommand(
        auth.id,
        dto.workspaceId ?? null,
        dto.title ?? null,
        dto.scope,
        dto.pageId ?? null,
        shareToken,
      ),
    );
  }

  @Get('conversations')
  @ResponseMessage('AI conversations found')
  listConversations(
    @Auth() auth: IAuth,
    @Query() query: ListAiConversationsRequestDto,
  ) {
    const { shareToken, ...filters } = query;
    return this.listConversationsHandler.execute(
      new ListConversationsQuery(auth.id, filters, shareToken),
    );
  }

  @Get('conversations/:conversationId')
  @ResponseMessage('AI conversation found')
  getConversation(
    @Auth() auth: IAuth,
    @Param('conversationId') conversationId: string,
    @Query('shareToken') shareToken?: string,
  ) {
    return this.getConversationHandler.execute(
      new GetConversationQuery(auth.id, conversationId, shareToken),
    );
  }

  @Post('conversations/:conversationId/messages')
  @WriteRateLimit()
  @ResponseMessage('AI message submitted')
  submitMessage(
    @Auth() auth: IAuth,
    @Param('conversationId') conversationId: string,
    @Body() dto: SubmitAiMessageRequestDto,
    @Query('shareToken') shareToken?: string,
  ) {
    return this.aiAssistantService.submit({
      requestId: dto.requestId ?? randomUUID(),
      userId: auth.id,
      conversationId,
      capability: dto.capability,
      content: dto.content,
      input: dto.input ?? {
        message: dto.content,
      },
      context: dto.context,
      shareToken,
    });
  }

  @Get('conversations/:conversationId/messages')
  @ResponseMessage('AI conversation messages found')
  listConversationMessages(
    @Auth() auth: IAuth,
    @Param('conversationId') conversationId: string,
    @Query() query: ListAiMessagesRequestDto,
  ) {
    return this.listConversationMessagesHandler.execute(
      new ListConversationMessagesQuery(
        auth.id,
        conversationId,
        { limit: query.limit, cursor: query.cursor },
        query.shareToken,
      ),
    );
  }

  @Get('conversations/:conversationId/generations')
  @ResponseMessage('AI conversation generations found')
  listConversationGenerations(
    @Auth() auth: IAuth,
    @Param('conversationId') conversationId: string,
    @Query() query: ListAiGenerationsRequestDto,
  ) {
    return this.listConversationGenerationsHandler.execute(
      new ListConversationGenerationsQuery(
        auth.id,
        conversationId,
        { limit: query.limit, cursor: query.cursor },
        query.shareToken,
      ),
    );
  }

  @Patch('conversations/:conversationId/archive')
  @WriteRateLimit()
  @ResponseMessage('AI conversation archived')
  archiveConversation(
    @Auth() auth: IAuth,
    @Param('conversationId') conversationId: string,
    @Query('shareToken') shareToken?: string,
  ) {
    return this.archiveConversationHandler.execute(
      new ArchiveConversationCommand(auth.id, conversationId, shareToken),
    );
  }

  @Post('pages/:pageId/modification-plan')
  @WriteRateLimit()
  @ResponseMessage('AI modification plan generated')
  generateModificationPlan(
    @Auth() auth: IAuth,
    @Param('pageId') pageId: string,
    @Body() dto: GenerateAiModificationPlanRequestDto,
    @Query('shareToken') shareToken?: string,
  ) {
    return this.aiModificationPlannerService.generate({
      requestId: dto.requestId ?? randomUUID(),
      userId: auth.id,
      pageId,
      instruction: dto.instruction,
      conversationId: dto.conversationId,
      shareToken,
    });
  }

  @Get('generations/:generationId')
  @ResponseMessage('AI generation found')
  getGeneration(
    @Auth() auth: IAuth,
    @Param('generationId') generationId: string,
    @Query('shareToken') shareToken?: string,
  ) {
    return this.getGenerationHandler.execute(
      new GetGenerationQuery(auth.id, generationId, shareToken),
    );
  }

  @Post('generations/:generationId/confirm')
  @WriteRateLimit()
  @ResponseMessage('AI generation confirmed')
  confirmGeneration(
    @Auth() auth: IAuth,
    @Param('generationId') generationId: string,
    @Body() dto: ConfirmPageCompositionRequestDto,
    @Query('shareToken') shareToken?: string,
  ) {
    return this.confirmGenerationHandler.execute(
      new ConfirmGenerationCommand(
        auth.id,
        generationId,
        dto.teamspaceId ?? null,
        dto.parentPageId ?? null,
        shareToken,
      ),
    );
  }

  @Post('generations/:generationId/discard')
  @WriteRateLimit()
  @ResponseMessage('AI generation discarded')
  discardGeneration(
    @Auth() auth: IAuth,
    @Param('generationId') generationId: string,
    @Query('shareToken') shareToken?: string,
  ) {
    return this.discardGenerationHandler.execute(
      new DiscardGenerationCommand(auth.id, generationId, shareToken),
    );
  }
}
