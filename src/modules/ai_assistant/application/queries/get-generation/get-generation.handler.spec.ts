import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { AiGeneration } from '../../../domain/aggregates/ai-generation/ai-generation.aggregate';
import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import { PAGE_COMPOSITION_CAPABILITY } from '../../constants/page-composition.constant';
import { PAGE_COMPOSITION_SCHEMA_VERSION } from '../../types/page-composition-draft';
import { GetGenerationHandler } from './get-generation.handler';
import { GetGenerationQuery } from './get-generation.query';

describe('GetGenerationHandler', () => {
  it('returns page composition output with preview', async () => {
    const draft = {
      schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
      type: 'PAGE_COMPOSITION' as const,
      page: {
        title: 'Sprint Planning',
      },
      blocks: [],
      databases: [],
    };

    const generation = AiGeneration.create({
      id: 'generation-1',
      conversationId: 'conversation-1',
      userId: 'user-1',
      workspaceId: null,
      capability: PAGE_COMPOSITION_CAPABILITY,
      inputData: {
        message: 'Create a sprint planning page',
      },
    });

    generation.complete({
      outputData: draft,
      provider: 'ollama',
      model: 'qwen3:4b-instruct',
    });

    const findByIdAndUserId = jest.fn().mockResolvedValue(generation);

    const authorize = jest.fn().mockResolvedValue(true);

    const handler = new GetGenerationHandler(
      {
        findByIdAndUserId,
      } as unknown as AiGenerationRepository,
      {
        authorize,
      } as unknown as AuthorizationService,
    );

    const result = await handler.execute(
      new GetGenerationQuery('user-1', 'generation-1'),
    );

    expect(findByIdAndUserId).toHaveBeenCalledWith('generation-1', 'user-1');

    expect(authorize).not.toHaveBeenCalled();

    expect(result.status).toBe(AiGenerationStatus.COMPLETED);

    expect(result.output_data).toEqual(draft);

    expect(result.preview).toEqual({
      type: 'PAGE_COMPOSITION',
      page: {
        title: 'Sprint Planning',
        icon: null,
        cover_url: null,
      },
      summary: {
        blocks: 0,
        databases: 0,
        database_rows: 0,
      },
    });
  });
});
