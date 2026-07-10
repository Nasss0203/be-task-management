import { AiGeneration } from '../domain/entities/ai-generation.entity';
import { AiGenerationStatus } from '../domain/enums/ai-generation-status.enum';
import { AiGenerationModel } from '../domain/models/ai-generation.model';
import { AiGenerationResponseDto } from '../dto/response/ai-generation.response.dto';
import { SaveAiGenerationInput } from '../interfaces/repositories/ai-generation.repository.interface';

export class AiGenerationMapper {
  static toModel(entity: AiGeneration): AiGenerationModel {
    return new AiGenerationModel(
      entity.id,
      entity.userId,
      entity.conversationId,
      entity.requestMessageId ?? null,
      entity.workspaceId ?? null,
      entity.projectId ?? null,
      entity.boardId ?? null,
      entity.sprintId ?? null,
      entity.generationType,
      entity.inputText,
      entity.inputContext ?? null,
      entity.outputData ?? null,
      entity.provider,
      entity.model,
      entity.status,
      entity.appliedResults ?? null,
      entity.inputTokens ?? null,
      entity.outputTokens ?? null,
      entity.totalTokens ?? null,
      entity.errorMessage ?? null,
      entity.appliedAt ?? null,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  static toEntity(
    model: AiGenerationModel | SaveAiGenerationInput,
  ): AiGeneration {
    const e = new AiGeneration();

    if ('id' in model && model.id != null) e.id = model.id;
    e.userId = model.userId;
    e.conversationId = model.conversationId;
    e.requestMessageId = model.requestMessageId ?? null;
    e.workspaceId = model.workspaceId ?? null;
    e.projectId = model.projectId ?? null;
    e.boardId = model.boardId ?? null;
    e.sprintId = model.sprintId ?? null;
    e.generationType = model.generationType;
    e.inputText = model.inputText;
    e.inputContext = model.inputContext ?? null;
    e.outputData = model.outputData ?? null;
    e.provider = model.provider;
    e.model = model.model;
    e.status = model.status ?? AiGenerationStatus.PROCESSING;
    e.appliedResults = model.appliedResults ?? null;
    e.inputTokens = model.inputTokens ?? null;
    e.outputTokens = model.outputTokens ?? null;
    e.totalTokens = model.totalTokens ?? null;
    e.errorMessage = model.errorMessage ?? null;
    e.appliedAt = model.appliedAt ?? null;
    if (model.createdAt != null) e.createdAt = model.createdAt;
    if (model.updatedAt != null) e.updatedAt = model.updatedAt;

    return e;
  }

  static toResponse(model: AiGenerationModel): AiGenerationResponseDto {
    return {
      id: model.id,
      userId: model.userId,
      conversationId: model.conversationId,
      requestMessageId: model.requestMessageId,
      workspaceId: model.workspaceId,
      projectId: model.projectId,
      boardId: model.boardId,
      sprintId: model.sprintId,
      generationType: model.generationType,
      inputText: model.inputText,
      inputContext: model.inputContext,
      outputData: model.outputData,
      provider: model.provider,
      model: model.model,
      status: model.status,
      appliedResults: model.appliedResults,
      inputTokens: model.inputTokens,
      outputTokens: model.outputTokens,
      totalTokens: model.totalTokens,
      errorMessage: model.errorMessage,
      appliedAt: model.appliedAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }
}
