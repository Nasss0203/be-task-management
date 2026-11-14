jest.mock('@nestjs/bullmq', () => ({
  Processor: () => () => undefined,
  OnWorkerEvent: () => () => undefined,
  WorkerHost: class {},
}));

import { DelayedError } from 'bullmq';

import {
  SlackRateLimitedError,
  SlackRetryableError,
} from '../../application/ports/slack-client.port';
import { SlackDeliveryError } from '../../domain/repositories/slack-connection.repository';
import {
  MAX_RATE_LIMITED_DELAYS,
  SlackDeliveryProcessor,
} from './slack-delivery.processor';

describe('SlackDeliveryProcessor', () => {
  const deliverHandler = { execute: jest.fn() };
  const connectionRepository = {
    findByUserId: jest.fn(),
    markDeliveryFailed: jest.fn(),
  };
  const processor = new SlackDeliveryProcessor(
    deliverHandler as never,
    connectionRepository as never,
  );
  const createJob = (data = {}, attemptsMade = 0) => ({
    data: { recipientUserId: 'user-1', notification: { id: 'n-1' }, ...data },
    attemptsMade,
    opts: { attempts: 5 },
    updateData: jest.fn(),
    moveToDelayed: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    connectionRepository.findByUserId.mockResolvedValue({
      id: 'connection-1',
    });
  });

  afterEach(() => jest.restoreAllMocks());

  it('waits as long as Slack asked without using a retry attempt', async () => {
    deliverHandler.execute.mockRejectedValue(
      new SlackRateLimitedError('429', 30_000),
    );
    const job = createJob();

    await expect(processor.process(job as never, 'token-1')).rejects.toThrow(
      DelayedError,
    );
    expect(job.updateData).toHaveBeenCalledWith(
      expect.objectContaining({ rateLimitedDelays: 1 }),
    );
    expect(job.moveToDelayed).toHaveBeenCalledWith(31_000, 'token-1');
  });

  it('stops waiting after the rate limit delay budget is spent', async () => {
    const error = new SlackRateLimitedError('429', 30_000);
    deliverHandler.execute.mockRejectedValue(error);
    const job = createJob({ rateLimitedDelays: MAX_RATE_LIMITED_DELAYS });

    await expect(processor.process(job as never, 'token-1')).rejects.toBe(
      error,
    );
    expect(job.moveToDelayed).not.toHaveBeenCalled();
  });

  it('lets other Slack failures use the normal retry', async () => {
    const error = new SlackRetryableError('503');
    deliverHandler.execute.mockRejectedValue(error);
    const job = createJob();

    await expect(processor.process(job as never, 'token-1')).rejects.toBe(
      error,
    );
    expect(job.moveToDelayed).not.toHaveBeenCalled();
  });

  it('does not record a failure while retries are left', async () => {
    await processor.onFailed(createJob({}, 4) as never, new Error('503'));

    expect(connectionRepository.markDeliveryFailed).not.toHaveBeenCalled();
  });

  it.each([
    [new SlackRateLimitedError('429', 1_000), SlackDeliveryError.RATE_LIMITED],
    [new SlackRetryableError('503'), SlackDeliveryError.DELIVERY_FAILED],
  ])('records the failure after the last attempt', async (error, expected) => {
    await processor.onFailed(createJob({}, 5) as never, error);

    expect(connectionRepository.findByUserId).toHaveBeenCalledWith('user-1');
    expect(connectionRepository.markDeliveryFailed).toHaveBeenCalledWith(
      'connection-1',
      expect.any(Date),
      expected,
    );
  });

  it('keeps the worker alive when the failure cannot be saved', async () => {
    connectionRepository.markDeliveryFailed.mockRejectedValue(
      new Error('db down'),
    );

    await expect(
      processor.onFailed(createJob({}, 5) as never, new Error('503')),
    ).resolves.toBeUndefined();
  });
});
