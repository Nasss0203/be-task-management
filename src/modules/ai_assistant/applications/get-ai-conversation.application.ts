import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AiConversationDetailResponseDto } from '../dto/response/ai-conversation-detail.response.dto';
import { GetAiConversationApplication } from '../interfaces/applications/get-ai-conversation.application.interface';
import { type AiConversationService } from '../interfaces/services/ai-conversation.service.interface';
import { type AiMessageService } from '../interfaces/services/ai-message.service.interface';
import { AI_ASSISTANT_TYPES } from '../interfaces/types';
import { AiConversationMapper } from '../mapper/ai-conversation.mapper';
import { AiMessageMapper } from '../mapper/ai-message.mapper';
import { AiGeneration } from '../domain/entities/ai-generation.entity';

@Injectable()
export class GetAiConversationApplicationImpl implements GetAiConversationApplication {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.services.AiConversationService)
    private readonly conversationService: AiConversationService,

    @Inject(AI_ASSISTANT_TYPES.services.AiMessageService)
    private readonly messageService: AiMessageService,

    private readonly entityManager: EntityManager,
  ) {}

  async get(
    input: Parameters<GetAiConversationApplication['get']>[0],
  ): Promise<AiConversationDetailResponseDto> {
    const conversation = await this.conversationService.findByIdForUser(
      input.conversationId,
      input.userId,
    );
    const messages = await this.messageService.listByConversationId(
      conversation.id,
    );

    // Fetch generations linked to this conversation
    const generations = await this.entityManager.getRepository(AiGeneration).find({
      where: { conversationId: conversation.id },
    });

    const generationMap = new Map<string, any>();
    for (const gen of generations) {
      generationMap.set(gen.id, gen);
    }

    return {
      conversation: AiConversationMapper.toResponse(conversation),
      messages: messages.map((message) => {
        const response = AiMessageMapper.toResponse(message);
        
        // Retrieve generationId from metadata if present
        const genId = message.metadata?.generationId as string | undefined;
        const gen = genId ? generationMap.get(genId) : null;

        if (gen) {
          response.generation = {
            id: gen.id,
            userId: gen.userId,
            conversationId: gen.conversationId,
            generationType: gen.generationType,
            outputData: gen.outputData,
            status: gen.status,
            appliedResults: gen.appliedResults,
          };
        } else {
          response.generation = null;
        }
        return response;
      }),
    };
  }
}
