import type { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';

import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../application/constants/ai-modification-plan.constant';
import { FastApiAiRuntimeAdapter } from './fast-api-ai-runtime.adapter';

jest.mock('@nestjs/axios', () => ({ HttpService: jest.fn() }));

// Ollama fails while it reloads a model or runs short of memory; cheap calls
// are tried once more, drafts never.
const unreachable = () =>
  Object.assign(new Error('connect ECONNREFUSED'), {
    isAxiosError: true,
    code: 'ECONNREFUSED',
  });
const unavailable = () =>
  Object.assign(new Error('Request failed with status code 503'), {
    isAxiosError: true,
    response: { status: 503 },
  });
const rejected = () =>
  Object.assign(new Error('Request failed with status code 502'), {
    isAxiosError: true,
    response: { status: 502 },
  });

const embeddings = {
  model: 'qwen3-embedding:0.6b',
  dimensions: 2,
  embeddings: [[0.6, 0.8]],
};

describe('FastApiAiRuntimeAdapter: one retry for cheap calls', () => {
  let post: jest.Mock;
  let adapter: FastApiAiRuntimeAdapter;

  beforeEach(() => {
    jest.useFakeTimers();
    post = jest.fn();
    adapter = new FastApiAiRuntimeAdapter(
      { post } as unknown as HttpService,
      new ConfigService({
        AI_SERVICE_BASE_URL: 'http://ai.test',
        AI_INTERNAL_TOKEN: 'private-test-token',
      }),
    );
  });

  afterEach(() => jest.useRealTimers());

  const settle = async <T>(promise: Promise<T>) => {
    const result = promise.then(
      (value) => ({ value }),
      (error: unknown) => ({ error }),
    );
    await jest.advanceTimersByTimeAsync(2000);
    return result;
  };

  it.each([
    ['no answer', unreachable],
    ["the AI service's 503", unavailable],
  ])('tries embeddings again after %s', async (_name, failure) => {
    post
      .mockReturnValueOnce(throwError(failure))
      .mockReturnValueOnce(of({ data: embeddings }));
    expect(await settle(adapter.embed('query', ['a']))).toEqual({
      value: embeddings,
    });
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('gives up after the second failure', async () => {
    post.mockReturnValue(throwError(unreachable));
    const outcome = await settle(adapter.embed('query', ['a']));
    expect((outcome as { error: unknown }).error).toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('does not retry an answer that is simply wrong', async () => {
    post.mockReturnValue(throwError(rejected));
    const outcome = await settle(adapter.embed('query', ['a']));
    expect((outcome as { error: unknown }).error).toBeInstanceOf(
      BadGatewayException,
    );
    expect(post).toHaveBeenCalledTimes(1);
  });

  it('never retries a draft, which costs a full model run', async () => {
    post.mockReturnValue(throwError(unavailable));
    const outcome = await settle(
      adapter.execute({
        requestId: 'r',
        capability: AI_MODIFICATION_PLAN_CAPABILITY,
        content: 'thêm checklist',
        input: {},
        context: { page: {} },
      }),
    );
    expect((outcome as { error: unknown }).error).toBeInstanceOf(
      BadGatewayException,
    );
    expect(post).toHaveBeenCalledTimes(1);
  });
});
