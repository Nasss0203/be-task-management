import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { ApplyAiGenerationDto } from '../dto/apply-ai-generation.dto';
import { CreateAiConversationDto } from '../dto/create-ai-conversation.dto';
import { AiConversationDetailResponseDto } from '../dto/response/ai-conversation-detail.response.dto';
import { AiConversationResponseDto } from '../dto/response/ai-conversation.response.dto';
import { AiGenerationResponseDto } from '../dto/response/ai-generation.response.dto';
import { SendAiMessageResponseDto } from '../dto/response/send-ai-message.response.dto';
import { SendAiMessageDto } from '../dto/send-ai-message.dto';
import { type ApplyAiGenerationApplication } from '../interfaces/applications/apply-ai-generation.application.interface';
import { type CreateAiConversationApplication } from '../interfaces/applications/create-ai-conversation.application.interface';
import { type DiscardAiGenerationApplication } from '../interfaces/applications/discard-ai-generation.application.interface';
import { type GetAiConversationApplication } from '../interfaces/applications/get-ai-conversation.application.interface';
import { type ListAiConversationsApplication } from '../interfaces/applications/list-ai-conversations.application.interface';
import { type SendAiMessageApplication } from '../interfaces/applications/send-ai-message.application.interface';
import { AI_ASSISTANT_TYPES } from '../interfaces/types';

@Controller('ai')
@ReadRateLimit()
export class AiAssistantController {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.applications.CreateAiConversationApplication)
    private readonly createAiConversationApplication: CreateAiConversationApplication,

    @Inject(AI_ASSISTANT_TYPES.applications.ListAiConversationsApplication)
    private readonly listAiConversationsApplication: ListAiConversationsApplication,

    @Inject(AI_ASSISTANT_TYPES.applications.GetAiConversationApplication)
    private readonly getAiConversationApplication: GetAiConversationApplication,

    @Inject(AI_ASSISTANT_TYPES.applications.SendAiMessageApplication)
    private readonly sendAiMessageApplication: SendAiMessageApplication,

    @Inject(AI_ASSISTANT_TYPES.applications.ApplyAiGenerationApplication)
    private readonly applyAiGenerationApplication: ApplyAiGenerationApplication,

    @Inject(AI_ASSISTANT_TYPES.applications.DiscardAiGenerationApplication)
    private readonly discardAiGenerationApplication: DiscardAiGenerationApplication,
  ) {}

  @Post('conversations')
  @WriteRateLimit()
  @ResponseMessage('Create AI conversation successfully')
  createConversation(
    @Body() dto: CreateAiConversationDto,
    @Auth() auth: IAuth,
  ): Promise<AiConversationResponseDto> {
    return this.createAiConversationApplication.create({
      userId: auth.id,
      dto,
    });
  }

  @Get('conversations')
  @ResponseMessage('List AI conversations successfully')
  listConversations(@Auth() auth: IAuth): Promise<AiConversationResponseDto[]> {
    return this.listAiConversationsApplication.list(auth.id);
  }

  @Get('conversations/:conversationId')
  @ResponseMessage('Get AI conversation successfully')
  getConversation(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Auth() auth: IAuth,
  ): Promise<AiConversationDetailResponseDto> {
    return this.getAiConversationApplication.get({
      conversationId,
      userId: auth.id,
    });
  }

  @Post('conversations/:conversationId/messages')
  @WriteRateLimit()
  @ResponseMessage('Send AI message successfully')
  sendMessage(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: SendAiMessageDto,
    @Auth() auth: IAuth,
  ): Promise<SendAiMessageResponseDto> {
    return this.sendAiMessageApplication.send({
      conversationId,
      userId: auth.id,
      systemRole: auth.systemRole as SystemRole,
      dto,
    });
  }

  @Post('generations/:generationId/apply')
  @WriteRateLimit()
  @ResponseMessage('Apply AI generation successfully')
  applyGeneration(
    @Param('generationId', ParseUUIDPipe) generationId: string,
    @Body() dto: ApplyAiGenerationDto,
    @Auth() auth: IAuth,
  ): Promise<AiGenerationResponseDto> {
    return this.applyAiGenerationApplication.apply({
      generationId,
      userId: auth.id,
      dto,
    });
  }

  @Patch('generations/:generationId/discard')
  @WriteRateLimit()
  @ResponseMessage('Discard AI generation successfully')
  discardGeneration(
    @Param('generationId', ParseUUIDPipe) generationId: string,
    @Auth() auth: IAuth,
  ): Promise<AiGenerationResponseDto> {
    return this.discardAiGenerationApplication.discard({
      generationId,
      userId: auth.id,
    });
  }
}
