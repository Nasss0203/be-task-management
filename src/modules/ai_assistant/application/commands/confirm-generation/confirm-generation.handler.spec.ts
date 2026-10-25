import { BadRequestException, NotFoundException } from '@nestjs/common';

import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';

import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../constants/ai-modification-plan.constant';
import { PAGE_COMPOSITION_CAPABILITY } from '../../constants/page-composition.constant';

import type { ConfirmAiModificationPlanHandler } from '../confirm-ai-modification-plan/confirm-ai-modification-plan.handler';
import type { ConfirmPageCompositionHandler } from '../confirm-page-composition/confirm-page-composition.handler';

import { ConfirmGenerationCommand } from './confirm-generation.command';
import { ConfirmGenerationHandler } from './confirm-generation.handler';

describe('ConfirmGenerationHandler', () => {
  let generationRepository: {
    findByIdAndUserId: jest.Mock;
  };

  let confirmPageCompositionHandler: {
    execute: jest.Mock;
  };

  let confirmAiModificationPlanHandler: {
    execute: jest.Mock;
  };

  let handler: ConfirmGenerationHandler;

  beforeEach(() => {
    generationRepository = {
      findByIdAndUserId: jest.fn(),
    };

    confirmPageCompositionHandler = {
      execute: jest.fn(),
    };

    confirmAiModificationPlanHandler = {
      execute: jest.fn(),
    };

    handler = new ConfirmGenerationHandler(
      generationRepository as unknown as AiGenerationRepository,
      confirmPageCompositionHandler as unknown as ConfirmPageCompositionHandler,
      confirmAiModificationPlanHandler as unknown as ConfirmAiModificationPlanHandler,
    );
  });

  it('dispatches page composition confirmation with page composition options', async () => {
    generationRepository.findByIdAndUserId.mockResolvedValue({
      getCapability: jest.fn().mockReturnValue(PAGE_COMPOSITION_CAPABILITY),
    });

    const expectedResult = {
      generation: {
        id: 'generation-1',
      },
      execution: {
        pageId: 'page-1',
      },
    };

    confirmPageCompositionHandler.execute.mockResolvedValue(expectedResult);

    const result = await handler.execute(
      new ConfirmGenerationCommand(
        'user-1',
        'generation-1',
        'teamspace-1',
        'parent-page-1',
        'share-token',
      ),
    );

    expect(generationRepository.findByIdAndUserId).toHaveBeenCalledWith(
      'generation-1',
      'user-1',
    );

    expect(confirmPageCompositionHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        generationId: 'generation-1',
        teamspaceId: 'teamspace-1',
        parentPageId: 'parent-page-1',
        shareToken: 'share-token',
      }),
    );

    expect(confirmAiModificationPlanHandler.execute).not.toHaveBeenCalled();

    expect(result).toBe(expectedResult);
  });

  it('dispatches AI modification plan confirmation with share token', async () => {
    generationRepository.findByIdAndUserId.mockResolvedValue({
      getCapability: jest.fn().mockReturnValue(AI_MODIFICATION_PLAN_CAPABILITY),
    });

    const expectedResult = {
      generation: {
        id: 'generation-1',
      },
      execution: {
        createdBlockIds: ['block-1'],
        createdRowIds: ['row-1'],
      },
    };

    confirmAiModificationPlanHandler.execute.mockResolvedValue(expectedResult);

    const result = await handler.execute(
      new ConfirmGenerationCommand(
        'user-1',
        'generation-1',
        null,
        null,
        'share-token',
      ),
    );

    expect(generationRepository.findByIdAndUserId).toHaveBeenCalledWith(
      'generation-1',
      'user-1',
    );

    expect(confirmAiModificationPlanHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        generationId: 'generation-1',
        shareToken: 'share-token',
      }),
    );

    expect(confirmPageCompositionHandler.execute).not.toHaveBeenCalled();

    expect(result).toBe(expectedResult);
  });

  it('rejects confirmation for an unsupported capability', async () => {
    generationRepository.findByIdAndUserId.mockResolvedValue({
      getCapability: jest.fn().mockReturnValue('writing.improve'),
    });

    await expect(
      handler.execute(new ConfirmGenerationCommand('user-1', 'generation-1')),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(confirmPageCompositionHandler.execute).not.toHaveBeenCalled();

    expect(confirmAiModificationPlanHandler.execute).not.toHaveBeenCalled();
  });

  it('rejects when generation does not exist for the user', async () => {
    generationRepository.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      handler.execute(new ConfirmGenerationCommand('user-1', 'generation-1')),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(confirmPageCompositionHandler.execute).not.toHaveBeenCalled();

    expect(confirmAiModificationPlanHandler.execute).not.toHaveBeenCalled();
  });
});
