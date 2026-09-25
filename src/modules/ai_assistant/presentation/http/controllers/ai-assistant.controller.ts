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
import { CreateConversationCommand } from '../../../application/commands/create-conversation/create-conversation.command';
import { CreateConversationHandler } from '../../../application/commands/create-conversation/create-conversation.handler';
import { CreateAiConversationRequestDto } from '../../../application/dto/request/create-ai-conversation.request.dto';
import { ListAiConversationsRequestDto } from '../../../application/dto/request/list-ai-conversations.request.dto';
import { ListAiMessagesRequestDto } from '../../../application/dto/request/list-ai-messages.request.dto';
import { SubmitAiMessageRequestDto } from '../../../application/dto/request/submit-ai-message.request.dto';
import { GetConversationHandler } from '../../../application/queries/get-conversation/get-conversation.handler';
import { GetConversationQuery } from '../../../application/queries/get-conversation/get-conversation.query';
import { GetGenerationHandler } from '../../../application/queries/get-generation/get-generation.handler';
import { GetGenerationQuery } from '../../../application/queries/get-generation/get-generation.query';
import { ListConversationMessagesHandler } from '../../../application/queries/list-conversation-messages/list-conversation-messages.handler';
import { ListConversationMessagesQuery } from '../../../application/queries/list-conversation-messages/list-conversation-messages.query';
import { ListConversationsHandler } from '../../../application/queries/list-conversations/list-conversations.handler';
import { ListConversationsQuery } from '../../../application/queries/list-conversations/list-conversations.query';
import { AiAssistantService } from '../../../application/services/ai-assistant.service';

@Controller('ai-assistant')
@ReadRateLimit()
export class AiAssistantController {
  constructor(
    private readonly createConversationHandler: CreateConversationHandler,
    private readonly archiveConversationHandler: ArchiveConversationHandler,
    private readonly listConversationsHandler: ListConversationsHandler,
    private readonly getConversationHandler: GetConversationHandler,
    private readonly listConversationMessagesHandler: ListConversationMessagesHandler,
    private readonly getGenerationHandler: GetGenerationHandler,
    private readonly aiAssistantService: AiAssistantService,
  ) {}

  @Post('conversations')
  @WriteRateLimit()
  @ResponseMessage('AI conversation created')
  createConversation(
    @Auth() auth: IAuth,
    @Body() dto: CreateAiConversationRequestDto,
  ) {
    return this.createConversationHandler.execute(
      new CreateConversationCommand(
        auth.id,
        dto.workspaceId ?? null,
        dto.title ?? null,
      ),
    );
  }

  @Get('conversations')
  @ResponseMessage('AI conversations found')
  listConversations(
    @Auth() auth: IAuth,
    @Query() query: ListAiConversationsRequestDto,
  ) {
    return this.listConversationsHandler.execute(
      new ListConversationsQuery(auth.id, query),
    );
  }

  @Get('conversations/:conversationId')
  @ResponseMessage('AI conversation found')
  getConversation(
    @Auth() auth: IAuth,
    @Param('conversationId') conversationId: string,
  ) {
    return this.getConversationHandler.execute(
      new GetConversationQuery(auth.id, conversationId),
    );
  }

  @Post('conversations/:conversationId/messages')
  @WriteRateLimit()
  @ResponseMessage('AI message submitted')
  submitMessage(
    @Auth() auth: IAuth,
    @Param('conversationId') conversationId: string,
    @Body() dto: SubmitAiMessageRequestDto,
  ) {
    return this.aiAssistantService.submit({
      requestId: dto.requestId ?? randomUUID(),
      userId: auth.id,
      conversationId,
      capability: dto.capability,
      content: dto.content,
      input: dto.input ?? { message: dto.content },
      context: dto.context,
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
      new ListConversationMessagesQuery(auth.id, conversationId, query),
    );
  }

  @Patch('conversations/:conversationId/archive')
  @WriteRateLimit()
  @ResponseMessage('AI conversation archived')
  archiveConversation(
    @Auth() auth: IAuth,
    @Param('conversationId') conversationId: string,
  ) {
    return this.archiveConversationHandler.execute(
      new ArchiveConversationCommand(auth.id, conversationId),
    );
  }

  @Get('generations/:generationId')
  @ResponseMessage('AI generation found')
  getGeneration(
    @Auth() auth: IAuth,
    @Param('generationId') generationId: string,
  ) {
    return this.getGenerationHandler.execute(
      new GetGenerationQuery(auth.id, generationId),
    );
  }
}
