import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';

import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';

import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';

import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';

import { PAGE_COMPOSITION_CAPABILITY } from '../../constants/page-composition.constant';
import { PAGE_COMPOSITION_SCHEMA_VERSION } from '../../types/page-composition-draft';

import type { PageCompositionDraftValidator } from '../../services/page-composition-draft-validator.service';
import type { PageCompositionExecutor } from '../../services/page-composition-executor.service';

import type { ApplyGenerationHandler } from '../apply-generation/apply-generation.handler';

import { ConfirmPageCompositionCommand } from './confirm-page-composition.command';
import { ConfirmPageCompositionHandler } from './confirm-page-composition.handler';

function createFixture() {
  const draft = {
    schemaVersion: PAGE_COMPOSITION_SCHEMA_VERSION,
    type: 'PAGE_COMPOSITION' as const,
    page: {
      title: 'Sprint Planning',
    },
    blocks: [],
    databases: [],
  };

  const generation = {
    getCapability: jest.fn().mockReturnValue(PAGE_COMPOSITION_CAPABILITY),

    getStatus: jest.fn().mockReturnValue(AiGenerationStatus.COMPLETED),

    getWorkspaceId: jest.fn().mockReturnValue('workspace-1'),

    getOutputData: jest.fn().mockReturnValue(draft),
  };

  const findByIdAndUserId = jest.fn().mockResolvedValue(generation);

  const findPageById = jest.fn();

  const authorize = jest.fn().mockResolvedValue(true);

  const validate = jest.fn().mockReturnValue(draft);

  const executionResult = {
    pageId: 'page-1',
    blockIds: {},
    databaseIds: {},
    propertyIds: {},
    optionIds: {},
    viewIds: {},
    rowIds: {},
  };

  const executorExecute = jest.fn().mockResolvedValue(executionResult);

  const appliedGeneration = {
    id: 'generation-1',
    status: AiGenerationStatus.APPLIED,
  };

  const applyGenerationExecute = jest.fn().mockResolvedValue(appliedGeneration);

  const context = {};

  const runInTransaction = jest.fn(
    async (callback: (context: unknown) => Promise<unknown>) =>
      await callback(context),
  );

  const handler = new ConfirmPageCompositionHandler(
    {
      findByIdAndUserId,
    } as unknown as AiGenerationRepository,

    {
      findById: findPageById,
    } as unknown as PageRepository,

    {
      authorize,
    } as unknown as AuthorizationService,

    {
      validate,
    } as unknown as PageCompositionDraftValidator,

    {
      execute: executorExecute,
    } as unknown as PageCompositionExecutor,

    {
      execute: applyGenerationExecute,
    } as unknown as ApplyGenerationHandler,

    {
      runInTransaction,
    } as unknown as UnitOfWork,
  );

  return {
    handler,

    draft,
    generation,

    context,

    executionResult,
    appliedGeneration,

    findByIdAndUserId,
    findPageById,
    authorize,
    validate,
    executorExecute,
    applyGenerationExecute,
    runInTransaction,
  };
}

describe('ConfirmPageCompositionHandler', () => {
  it('re-authorizes, revalidates, executes, and applies a completed page composition generation', async () => {
    const fixture = createFixture();

    const result = await fixture.handler.execute(
      new ConfirmPageCompositionCommand('user-1', 'generation-1'),
    );

    expect(fixture.runInTransaction).toHaveBeenCalledTimes(1);

    expect(fixture.findByIdAndUserId).toHaveBeenCalledWith(
      'generation-1',
      'user-1',
      fixture.context,
    );

    expect(fixture.authorize).toHaveBeenCalledWith({
      userId: 'user-1',
      permissions: [PERMISSIONS.PAGE_CREATE],
      target: {
        type: 'workspace',
        id: 'workspace-1',
      },
    });

    expect(fixture.validate).toHaveBeenCalledWith(fixture.draft);

    expect(fixture.executorExecute).toHaveBeenCalledWith({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      teamspaceId: null,
      parentPageId: null,
      draft: fixture.draft,
    });

    expect(fixture.applyGenerationExecute).toHaveBeenCalledTimes(1);

    const [applyCommand, applyContext] =
      fixture.applyGenerationExecute.mock.calls[0];

    expect(applyCommand.userId).toBe('user-1');
    expect(applyCommand.generationId).toBe('generation-1');

    expect(applyContext).toBe(fixture.context);

    expect(result).toEqual({
      generation: fixture.appliedGeneration,
      execution: fixture.executionResult,
    });
  });

  it('authorizes against the requested teamspace when creating a root page in a teamspace', async () => {
    const fixture = createFixture();

    await fixture.handler.execute(
      new ConfirmPageCompositionCommand(
        'user-1',
        'generation-1',
        'teamspace-1',
      ),
    );

    expect(fixture.findPageById).not.toHaveBeenCalled();

    expect(fixture.authorize).toHaveBeenCalledWith({
      userId: 'user-1',
      permissions: [PERMISSIONS.PAGE_CREATE],
      target: {
        type: 'teamspace',
        id: 'teamspace-1',
        workspaceId: 'workspace-1',
      },
    });

    expect(fixture.executorExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-1',
        teamspaceId: 'teamspace-1',
        parentPageId: null,
      }),
    );
  });

  it('resolves the effective teamspace from the parent page before authorization', async () => {
    const fixture = createFixture();

    fixture.findPageById.mockResolvedValue({
      getDeletedAt: jest.fn().mockReturnValue(null),
      getWorkspaceId: jest.fn().mockReturnValue('workspace-1'),
      getTeamspaceId: jest.fn().mockReturnValue('teamspace-parent'),
    });

    await fixture.handler.execute(
      new ConfirmPageCompositionCommand(
        'user-1',
        'generation-1',
        undefined,
        'parent-page-1',
      ),
    );

    expect(fixture.findPageById).toHaveBeenCalledWith(
      'parent-page-1',
      fixture.context,
    );

    expect(fixture.authorize).toHaveBeenCalledWith({
      userId: 'user-1',
      permissions: [PERMISSIONS.PAGE_CREATE],
      target: {
        type: 'teamspace',
        id: 'teamspace-parent',
        workspaceId: 'workspace-1',
      },
    });

    expect(fixture.executorExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: 'workspace-1',
        teamspaceId: 'teamspace-parent',
        parentPageId: 'parent-page-1',
      }),
    );
  });

  it('rejects a parent page from another workspace before execution', async () => {
    const fixture = createFixture();

    fixture.findPageById.mockResolvedValue({
      getDeletedAt: jest.fn().mockReturnValue(null),
      getWorkspaceId: jest.fn().mockReturnValue('workspace-2'),
      getTeamspaceId: jest.fn().mockReturnValue(null),
    });

    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand(
          'user-1',
          'generation-1',
          undefined,
          'parent-page-1',
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(fixture.authorize).not.toHaveBeenCalled();
    expect(fixture.validate).not.toHaveBeenCalled();
    expect(fixture.executorExecute).not.toHaveBeenCalled();
    expect(fixture.applyGenerationExecute).not.toHaveBeenCalled();
  });

  it('rejects an explicit teamspace that conflicts with the parent page teamspace', async () => {
    const fixture = createFixture();

    fixture.findPageById.mockResolvedValue({
      getDeletedAt: jest.fn().mockReturnValue(null),
      getWorkspaceId: jest.fn().mockReturnValue('workspace-1'),
      getTeamspaceId: jest.fn().mockReturnValue('teamspace-parent'),
    });

    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand(
          'user-1',
          'generation-1',
          'teamspace-other',
          'parent-page-1',
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(fixture.authorize).not.toHaveBeenCalled();
    expect(fixture.executorExecute).not.toHaveBeenCalled();
    expect(fixture.applyGenerationExecute).not.toHaveBeenCalled();
  });

  it('rejects when the generation does not exist for the user', async () => {
    const fixture = createFixture();

    fixture.findByIdAndUserId.mockResolvedValue(null);

    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand('user-1', 'generation-1'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(fixture.authorize).not.toHaveBeenCalled();
    expect(fixture.validate).not.toHaveBeenCalled();
    expect(fixture.executorExecute).not.toHaveBeenCalled();
    expect(fixture.applyGenerationExecute).not.toHaveBeenCalled();
  });

  it('rejects a generation with another capability', async () => {
    const fixture = createFixture();

    fixture.generation.getCapability.mockReturnValue('writing.improve');

    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand('user-1', 'generation-1'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(fixture.authorize).not.toHaveBeenCalled();
    expect(fixture.validate).not.toHaveBeenCalled();
    expect(fixture.executorExecute).not.toHaveBeenCalled();
    expect(fixture.applyGenerationExecute).not.toHaveBeenCalled();
  });

  it('rejects a generation that is not completed', async () => {
    const fixture = createFixture();

    fixture.generation.getStatus.mockReturnValue(AiGenerationStatus.PROCESSING);

    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand('user-1', 'generation-1'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(fixture.authorize).not.toHaveBeenCalled();
    expect(fixture.validate).not.toHaveBeenCalled();
    expect(fixture.executorExecute).not.toHaveBeenCalled();
    expect(fixture.applyGenerationExecute).not.toHaveBeenCalled();
  });

  it('does not execute or apply when re-authorization fails', async () => {
    const fixture = createFixture();

    fixture.authorize.mockResolvedValue(false);

    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand('user-1', 'generation-1'),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(fixture.validate).not.toHaveBeenCalled();

    expect(fixture.executorExecute).not.toHaveBeenCalled();

    expect(fixture.applyGenerationExecute).not.toHaveBeenCalled();
  });

  it('does not execute or apply when re-validation fails', async () => {
    const fixture = createFixture();

    fixture.validate.mockImplementation(() => {
      throw new BadRequestException(
        'AI returned an invalid page composition draft',
      );
    });

    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand('user-1', 'generation-1'),
      ),
    ).rejects.toThrow('AI returned an invalid page composition draft');

    expect(fixture.authorize).toHaveBeenCalledTimes(1);

    expect(fixture.executorExecute).not.toHaveBeenCalled();

    expect(fixture.applyGenerationExecute).not.toHaveBeenCalled();
  });

  it('does not mark the generation applied when execution fails', async () => {
    const fixture = createFixture();

    fixture.executorExecute.mockRejectedValue(new Error('execution failed'));

    await expect(
      fixture.handler.execute(
        new ConfirmPageCompositionCommand('user-1', 'generation-1'),
      ),
    ).rejects.toThrow('execution failed');

    expect(fixture.validate).toHaveBeenCalledTimes(1);

    expect(fixture.executorExecute).toHaveBeenCalledTimes(1);

    expect(fixture.applyGenerationExecute).not.toHaveBeenCalled();
  });

  it('performs authorization and validation before execution, and applies only after execution', async () => {
    const fixture = createFixture();

    await fixture.handler.execute(
      new ConfirmPageCompositionCommand('user-1', 'generation-1'),
    );

    const authorizeOrder = fixture.authorize.mock.invocationCallOrder[0];

    const validateOrder = fixture.validate.mock.invocationCallOrder[0];

    const executeOrder = fixture.executorExecute.mock.invocationCallOrder[0];

    const applyOrder =
      fixture.applyGenerationExecute.mock.invocationCallOrder[0];

    expect(authorizeOrder).toBeLessThan(validateOrder);
    expect(validateOrder).toBeLessThan(executeOrder);
    expect(executeOrder).toBeLessThan(applyOrder);
  });
});
