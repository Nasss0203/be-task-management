import type { HttpService } from '@nestjs/axios';
import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { FastApiAiRuntimeAdapter } from './fast-api-ai-runtime.adapter';

// HTTP is mocked; avoid loading the ESM-only Nest Axios module in CommonJS Jest.
jest.mock('@nestjs/axios', () => ({ HttpService: jest.fn() }));

describe('FastApiAiRuntimeAdapter usage', () => {
  const response = {
    result: 'Result',
    provider: 'ollama',
    model: 'qwen3:1.7b',
  };
  const usage = {
    prompt_tokens: 314,
    completion_tokens: 38,
    total_tokens: 352,
  };

  function execute(
    data: Record<string, unknown>,
    capability = 'writing.improve',
  ) {
    const adapter = new FastApiAiRuntimeAdapter(
      {
        post: jest.fn().mockReturnValue(of({ data })),
      } as unknown as HttpService,
      new ConfigService({
        AI_SERVICE_BASE_URL: 'http://ai.test',
        AI_INTERNAL_TOKEN: 'test-token',
      }),
    );
    return adapter.execute({
      requestId: 'request-1',
      capability,
      input: { text: 'Original' },
    });
  }

  it('maps token metadata to the runtime contract', async () => {
    await expect(execute({ ...response, usage })).resolves.toEqual({
      output: { text: 'Result' },
      provider: 'ollama',
      model: 'qwen3:1.7b',
      usage: { promptTokens: 314, completionTokens: 38, totalTokens: 352 },
    });
  });

  it('succeeds with no usage property when metadata is absent', async () => {
    const result = await execute(response);
    expect(result).toEqual({
      output: { text: 'Result' },
      provider: 'ollama',
      model: 'qwen3:1.7b',
    });
    expect(result).not.toHaveProperty('usage');
  });

  it('preserves the returned model and total without recalculating it', async () => {
    const result = await execute(
      {
        ...response,
        model: 'qwen3:4b-instruct',
        usage: { ...usage, total_tokens: 400 },
      },
      'writing.continue',
    );
    expect(result.model).toBe('qwen3:4b-instruct');
    expect(result.provider).toBe('ollama');
    expect(result.usage?.totalTokens).toBe(400);
  });

  it('accepts zero token counts', async () => {
    const result = await execute({
      ...response,
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    });
    expect(result.usage).toEqual({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    });
  });

  describe.each(['prompt_tokens', 'completion_tokens', 'total_tokens'])(
    '%s validation',
    (field) => {
      it('rejects a missing field', async () => {
        const partial: Record<string, unknown> = { ...usage };
        delete partial[field];
        await expect(execute({ ...response, usage: partial })).rejects.toThrow(
          BadGatewayException,
        );
      });

      it.each([-1, 1.5, '314', true, null, undefined, NaN, Infinity])(
        'rejects %p',
        async (value) => {
          await expect(
            execute({ ...response, usage: { ...usage, [field]: value } }),
          ).rejects.toThrow(BadGatewayException);
        },
      );
    },
  );

  it.each([null, undefined, false, 0, 'invalid', []])(
    'rejects malformed usage container %p',
    async (value) => {
      await expect(execute({ ...response, usage: value })).rejects.toThrow(
        new BadGatewayException('AI service returned an invalid response'),
      );
    },
  );
});
