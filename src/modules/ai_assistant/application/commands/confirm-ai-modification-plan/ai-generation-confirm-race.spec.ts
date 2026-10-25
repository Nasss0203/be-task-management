import { AiConversationAccessService } from '../../services/ai-conversation-access.service';
import type { AiConversationRepository } from '../../../domain/repositories/ai-conversation.repository';
import type { PageRepository } from 'src/modules/content/domain/repositories/page.repository';
import { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import { BadRequestException, ConflictException } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import type { AiPageContextTransactionLocker } from '../../services/ai-page-context-transaction-lock.port';
import type { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PageBlockType } from 'src/shared/domain/page-block-type.enum';
import { AiGeneration } from '../../../domain/aggregates/ai-generation/ai-generation.aggregate';
import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import type { GetAiPageContextHandler } from '../../queries/get-ai-page-context/get-ai-page-context.handler';
import type { AiModificationPlanExecutor } from '../../services/ai-modification-plan-executor.service';
import type { AiModificationPlanValidatorService } from '../../services/ai-modification-plan-validator.service';
import { fingerprintAiPageContext } from '../../services/ai-page-context-fingerprint';
import type { AiPageContextResponseDto } from '../../dto/response/ai-page-context.response.dto';
import { ApplyGenerationHandler } from '../apply-generation/apply-generation.handler';
import { DiscardGenerationCommand } from '../discard-generation/discard-generation.command';
import { DiscardGenerationHandler } from '../discard-generation/discard-generation.handler';
import { ConfirmAiModificationPlanCommand } from './confirm-ai-modification-plan.command';
import { ConfirmAiModificationPlanHandler } from './confirm-ai-modification-plan.handler';

/** A controllable row-lock simulation. The TypeORM repository spec separately
 * verifies that the real adapter issues pessimistic_write in a transaction. */
describe('AI generation Confirm concurrency', () => {
  function setup() {
    const pageContext = {
      schemaVersion: 1 as const,
      builtAt: '2026-10-19T08:00:00Z',
      page: {
        id: 'page-1',
        workspaceId: 'workspace-1',
        teamspaceId: null,
        parentPageId: null,
        title: 'Page 1',
        icon: null,
        coverUrl: null,
        updatedAt: '2026-10-19T07:00:00Z',
      },
      blocks: [],
      databaseReferences: [],
      databases: [],
      completeness: {
        blocks: { total: 0, included: 0, truncated: false },
        databases: { total: 0, included: 0, truncated: false },
        rows: [],
        textTruncated: false,
      },
    } satisfies AiPageContextResponseDto;
    const plan = {
      schemaVersion: 1 as const,
      type: 'AI_MODIFICATION_PLAN' as const,
      pageId: 'page-1',
      status: 'PLAN_READY' as const,
      summary: 'Add a block',
      operations: [
        {
          type: 'INSERT_BLOCKS' as const,
          parentBlockId: null,
          afterBlockId: null,
          blocks: [
            { type: PageBlockType.TEXT, content: { text: 'New block' } },
          ],
        },
      ],
    };
    const generation = AiGeneration.create({
      id: 'generation-1',
      userId: 'user-1',
      workspaceId: 'workspace-1',
      capability: 'GENERATE_PAGE_MODIFICATION_PLAN',
      inputData: {
        pageId: 'page-1',
        pageContextFingerprint: fingerprintAiPageContext(pageContext),
      },
      outputData: plan,
      status: AiGenerationStatus.COMPLETED,
    });

    let previousLock: Promise<void> = Promise.resolve();
    const findByIdAndUserIdForUpdate = jest.fn(
      async (_id: string, _userId: string, context: { unlock: () => void }) => {
        const wait = previousLock;
        let unlock!: () => void;
        previousLock = new Promise<void>((resolve) => {
          unlock = resolve;
        });
        await wait;
        context.unlock = unlock;
        return generation;
      },
    );

    const save = jest.fn((value: AiGeneration) => Promise.resolve(value));
    const generationRepository = {
      findByIdAndUserIdForUpdate,
      findByIdAndUserId: jest.fn().mockResolvedValue(generation),
      save,
    } as unknown as AiGenerationRepository;
    const unitOfWork: UnitOfWork = {
      runInTransaction: async (fn) => {
        const context = { unlock: () => undefined };
        try {
          return await fn(context as PersistenceContext);
        } finally {
          context.unlock();
        }
      },
    };

    const executor = { execute: jest.fn() };
    const confirm = new ConfirmAiModificationPlanHandler(
      generationRepository,
      {
        authorize: jest.fn().mockResolvedValue(true),
      } as unknown as AuthorizationService,
      {
        execute: jest.fn().mockResolvedValue(pageContext),
      } as unknown as GetAiPageContextHandler,
      {
        validate: jest.fn().mockReturnValue(plan),
      } as unknown as AiModificationPlanValidatorService,
      executor as unknown as AiModificationPlanExecutor,
      new ApplyGenerationHandler(generationRepository),
      unitOfWork,
      {
        lock: jest.fn().mockResolvedValue(undefined),
      } as unknown as AiPageContextTransactionLocker,
    );
    const discard = new DiscardGenerationHandler(
      generationRepository,
      unitOfWork,
      {} as AiConversationRepository,
      new AiConversationAccessService(
        {
          findById: jest
            .fn()
            .mockResolvedValue(
              new Page(
                'page-1',
                'workspace-1',
                'Page',
                null,
                null,
                null,
                null,
                null,
                null,
                'user-1',
                new Date(),
                new Date(),
              ),
            ),
        } as unknown as PageRepository,
        {
          authorize: jest.fn().mockResolvedValue(true),
        } as unknown as AuthorizationService,
      ),
    );

    return {
      generation,
      confirm,
      discard,
      executor,
      save,
      findByIdAndUserIdForUpdate,
    };
  }

  function holdExecutor(executor: { execute: jest.Mock }) {
    let release!: () => void;
    let started!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const executing = new Promise<void>((resolve) => {
      started = resolve;
    });
    executor.execute.mockImplementation(async () => {
      started();
      await gate;
      return { createdBlockIds: ['block-1'], createdRowIds: [] };
    });
    return { release, executing };
  }

  const confirmCommand = new ConfirmAiModificationPlanCommand(
    'user-1',
    'generation-1',
  );
  const discardCommand = new DiscardGenerationCommand('user-1', 'generation-1');

  it('executes only once when two Confirms race for the same generation', async () => {
    const fixture = setup();
    const { executing, release } = holdExecutor(fixture.executor);

    const first = fixture.confirm.execute(confirmCommand);
    await executing;
    const second = fixture.confirm.execute(confirmCommand);
    release();

    await expect(first).resolves.toMatchObject({
      generation: { status: AiGenerationStatus.APPLIED },
    });
    await expect(second).rejects.toBeInstanceOf(BadRequestException);
    expect(fixture.findByIdAndUserIdForUpdate).toHaveBeenCalledTimes(2);
    expect(fixture.executor.execute).toHaveBeenCalledTimes(1);
    expect(fixture.save).toHaveBeenCalledTimes(1);
    expect(fixture.generation.getStatus()).toBe(AiGenerationStatus.APPLIED);
  });

  it('cannot Discard while an in-flight Confirm holds the generation lock', async () => {
    const fixture = setup();
    const { executing, release } = holdExecutor(fixture.executor);

    const first = fixture.confirm.execute(confirmCommand);
    await executing;
    const second = fixture.discard.execute(discardCommand);
    release();

    await expect(first).resolves.toMatchObject({
      generation: { status: AiGenerationStatus.APPLIED },
    });
    await expect(second).rejects.toBeInstanceOf(ConflictException);
    expect(fixture.executor.execute).toHaveBeenCalledTimes(1);
    expect(fixture.save).toHaveBeenCalledTimes(1);
    expect(fixture.generation.getStatus()).toBe(AiGenerationStatus.APPLIED);
  });

  it('cannot Confirm after a competing Discard has committed', async () => {
    const fixture = setup();
    fixture.executor.execute.mockResolvedValue({
      createdBlockIds: [],
      createdRowIds: [],
    });

    const first = fixture.discard.execute(discardCommand);
    const second = fixture.confirm.execute(confirmCommand);

    await expect(first).resolves.toMatchObject({
      status: AiGenerationStatus.DISCARDED,
    });
    await expect(second).rejects.toBeInstanceOf(BadRequestException);
    expect(fixture.executor.execute).not.toHaveBeenCalled();
    expect(fixture.save).toHaveBeenCalledTimes(1);
  });

  it('releases the lock after a failed Confirm, allowing a safe retry', async () => {
    const fixture = setup();
    fixture.executor.execute
      .mockRejectedValueOnce(new Error('operation failed'))
      .mockResolvedValueOnce({
        createdBlockIds: ['block-1'],
        createdRowIds: [],
      });

    const first = fixture.confirm.execute(confirmCommand);
    const second = fixture.confirm.execute(confirmCommand);

    await expect(first).rejects.toThrow('operation failed');
    await expect(second).resolves.toMatchObject({
      generation: { status: AiGenerationStatus.APPLIED },
    });
    expect(fixture.executor.execute).toHaveBeenCalledTimes(2);
    expect(fixture.save).toHaveBeenCalledTimes(1);
  });
});
