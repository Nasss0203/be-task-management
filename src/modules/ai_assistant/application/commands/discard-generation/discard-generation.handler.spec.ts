import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { AiGeneration } from '../../../domain/aggregates/ai-generation/ai-generation.aggregate';
import { AiGenerationStatus } from '../../../domain/enums/ai-generation-status.enum';
import type { AiGenerationRepository } from '../../../domain/repositories/ai-generation.repository';
import { DiscardGenerationCommand } from './discard-generation.command';
import { DiscardGenerationHandler } from './discard-generation.handler';

describe('DiscardGenerationHandler transaction safety', () => {
  const context: PersistenceContext = { transaction: 'active' };
  const command = new DiscardGenerationCommand('user-1', 'generation-1');

  function setup(initialStatus = AiGenerationStatus.COMPLETED) {
    const generation = AiGeneration.create({
      id: 'generation-1',
      userId: 'user-1',
      capability: 'GENERATE_PAGE_MODIFICATION_PLAN',
      status: initialStatus,
    });
    const findByIdAndUserIdForUpdate = jest.fn().mockResolvedValue(generation);
    const save = jest.fn((value: AiGeneration) => Promise.resolve(value));
    const runInTransaction = jest.fn(
      async (fn: (ctx: PersistenceContext) => Promise<unknown>) => fn(context),
    );
    const handler = new DiscardGenerationHandler(
      { findByIdAndUserIdForUpdate, save } as unknown as AiGenerationRepository,
      { runInTransaction } as unknown as UnitOfWork,
    );

    return {
      handler,
      generation,
      findByIdAndUserIdForUpdate,
      save,
      runInTransaction,
    };
  }

  it('locks, discards and saves using the same transaction context', async () => {
    const fixture = setup();
    const result = await fixture.handler.execute(command);

    expect(fixture.runInTransaction).toHaveBeenCalledTimes(1);
    expect(fixture.findByIdAndUserIdForUpdate).toHaveBeenCalledWith(
      'generation-1',
      'user-1',
      context,
    );
    expect(fixture.save).toHaveBeenCalledWith(fixture.generation, context);
    expect(result.status).toBe(AiGenerationStatus.DISCARDED);
  });

  it('reuses an explicitly provided transaction rather than opening another', async () => {
    const fixture = setup();
    await fixture.handler.execute(command, context);

    expect(fixture.runInTransaction).not.toHaveBeenCalled();
    expect(fixture.findByIdAndUserIdForUpdate).toHaveBeenCalledWith(
      'generation-1',
      'user-1',
      context,
    );
  });

  it('rejects a discarded generation without saving a second time', async () => {
    const fixture = setup();
    await fixture.handler.execute(command);

    await expect(fixture.handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(fixture.save).toHaveBeenCalledTimes(1);
  });

  it('cannot discard a generation already applied by Confirm', async () => {
    const fixture = setup(AiGenerationStatus.APPLIED);

    await expect(fixture.handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(fixture.save).not.toHaveBeenCalled();
  });

  it('fails safely if the owned generation does not exist', async () => {
    const fixture = setup();
    fixture.findByIdAndUserIdForUpdate.mockResolvedValue(null);

    await expect(fixture.handler.execute(command)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(fixture.save).not.toHaveBeenCalled();
  });

  it('propagates database failures for UnitOfWork to roll back', async () => {
    const fixture = setup();
    fixture.save.mockRejectedValue(new Error('database write failed'));

    await expect(fixture.handler.execute(command)).rejects.toThrow(
      'database write failed',
    );
    expect(fixture.runInTransaction).toHaveBeenCalledTimes(1);
  });
});
