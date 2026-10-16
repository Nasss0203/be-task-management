import type { HttpService } from '@nestjs/axios';
import { BadGatewayException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

import { AI_MODIFICATION_PLAN_CAPABILITY } from '../../application/constants/ai-modification-plan.constant';
import { PAGE_COMPOSITION_CAPABILITY } from '../../application/constants/page-composition.constant';
import { FastApiAiRuntimeAdapter } from './fast-api-ai-runtime.adapter';

// HTTP is mocked; avoid loading the ESM-only Nest Axios module in CommonJS Jest.
jest.mock('@nestjs/axios', () => ({
  HttpService: jest.fn(),
}));

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
        post: jest.fn().mockReturnValue(
          of({
            data,
          }),
        ),
      } as unknown as HttpService,
      new ConfigService({
        AI_SERVICE_BASE_URL: 'http://ai.test',
        AI_INTERNAL_TOKEN: 'test-token',
      }),
    );

    return adapter.execute({
      requestId: 'request-1',
      capability,
      content: 'Original',
      input: {
        text: 'Original',
      },
    });
  }

  it('maps token metadata to the runtime contract', async () => {
    await expect(
      execute({
        ...response,
        usage,
      }),
    ).resolves.toEqual({
      output: {
        text: 'Result',
      },
      provider: 'ollama',
      model: 'qwen3:1.7b',
      usage: {
        promptTokens: 314,
        completionTokens: 38,
        totalTokens: 352,
      },
    });
  });

  it('succeeds with no usage property when metadata is absent', async () => {
    const result = await execute(response);

    expect(result).toEqual({
      output: {
        text: 'Result',
      },
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
        usage: {
          ...usage,
          total_tokens: 400,
        },
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
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
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
        const partial: Record<string, unknown> = {
          ...usage,
        };

        delete partial[field];

        await expect(
          execute({
            ...response,
            usage: partial,
          }),
        ).rejects.toThrow(BadGatewayException);
      });

      it.each([-1, 1.5, '314', true, null, undefined, NaN, Infinity])(
        'rejects %p',
        async (value) => {
          await expect(
            execute({
              ...response,
              usage: {
                ...usage,
                [field]: value,
              },
            }),
          ).rejects.toThrow(BadGatewayException);
        },
      );
    },
  );

  it.each([null, undefined, false, 0, 'invalid', []])(
    'rejects malformed usage container %p',
    async (value) => {
      await expect(
        execute({
          ...response,
          usage: value,
        }),
      ).rejects.toThrow(
        new BadGatewayException('AI service returned an invalid response'),
      );
    },
  );

  describe('page composition', () => {
    it('calls the page composition endpoint with content as instruction', async () => {
      const draft = {
        schemaVersion: 1,
        type: 'PAGE_COMPOSITION',
        page: {
          title: 'Sprint Tasks',
        },
        blocks: [],
        databases: [],
      };

      const post = jest.fn().mockReturnValue(
        of({
          data: {
            result: draft,
            provider: 'ollama',
            model: 'qwen3:4b-instruct',
            usage: {
              prompt_tokens: 100,
              completion_tokens: 50,
              total_tokens: 150,
            },
          },
        }),
      );

      const adapter = new FastApiAiRuntimeAdapter(
        {
          post,
        } as unknown as HttpService,
        new ConfigService({
          AI_SERVICE_BASE_URL: 'http://ai.test',
          AI_INTERNAL_TOKEN: 'test-token',
        }),
      );

      const result = await adapter.execute({
        requestId: 'request-page-1',
        capability: PAGE_COMPOSITION_CAPABILITY,
        content: 'Tạo một page Sprint Tasks.',
        input: {},
        context: {
          language: 'vi',
        },
      });

      expect(post).toHaveBeenCalledTimes(1);

      expect(post).toHaveBeenCalledWith(
        'http://ai.test/internal/v1/page-composition',
        {
          instruction: 'Tạo một page Sprint Tasks.',
          context: {
            language: 'vi',
          },
        },
        {
          timeout: 65000,
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Service-Token': 'test-token',
          },
        },
      );

      expect(result).toEqual({
        output: draft,
        provider: 'ollama',
        model: 'qwen3:4b-instruct',
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150,
        },
      });
    });

    it('omits context from the FastAPI payload when context is absent', async () => {
      const draft = {
        schemaVersion: 1,
        type: 'PAGE_COMPOSITION',
        page: {
          title: 'Simple Page',
        },
        blocks: [],
        databases: [],
      };

      const post = jest.fn().mockReturnValue(
        of({
          data: {
            result: draft,
            provider: 'ollama',
            model: 'qwen3:4b-instruct',
          },
        }),
      );

      const adapter = new FastApiAiRuntimeAdapter(
        {
          post,
        } as unknown as HttpService,
        new ConfigService({
          AI_SERVICE_BASE_URL: 'http://ai.test',
          AI_INTERNAL_TOKEN: 'test-token',
        }),
      );

      const result = await adapter.execute({
        requestId: 'request-page-2',
        capability: PAGE_COMPOSITION_CAPABILITY,
        content: 'Tạo một page đơn giản.',
        input: {},
      });

      expect(post).toHaveBeenCalledTimes(1);

      expect(post.mock.calls[0][0]).toBe(
        'http://ai.test/internal/v1/page-composition',
      );

      expect(post.mock.calls[0][1]).toEqual({
        instruction: 'Tạo một page đơn giản.',
      });

      expect(result).toEqual({
        output: draft,
        provider: 'ollama',
        model: 'qwen3:4b-instruct',
      });

      expect(result).not.toHaveProperty('usage');
    });

    it('rejects a non-object page composition result', async () => {
      const adapter = new FastApiAiRuntimeAdapter(
        {
          post: jest.fn().mockReturnValue(
            of({
              data: {
                result: 'invalid',
                provider: 'ollama',
                model: 'qwen3:4b-instruct',
              },
            }),
          ),
        } as unknown as HttpService,
        new ConfigService({
          AI_SERVICE_BASE_URL: 'http://ai.test',
          AI_INTERNAL_TOKEN: 'test-token',
        }),
      );

      await expect(
        adapter.execute({
          requestId: 'request-page-3',
          capability: PAGE_COMPOSITION_CAPABILITY,
          content: 'Tạo một page.',
          input: {},
        }),
      ).rejects.toThrow(BadGatewayException);
    });
  });

  describe('modification planner', () => {
    it('calls the modification planner endpoint with instruction and context', async () => {
      const context = {
        schemaVersion: 1,
        builtAt: '2026-10-06T08:00:00.000Z',
        page: {
          id: 'page-1',
          workspaceId: 'workspace-1',
          teamspaceId: null,
          parentPageId: null,
          title: 'Sprint Tasks',
          icon: null,
          coverUrl: null,
          updatedAt: '2026-10-06T08:00:00.000Z',
        },
        blocks: [],
        databaseReferences: [],
        databases: [],
        completeness: {
          blocks: {
            total: 0,
            included: 0,
            truncated: false,
          },
          databases: {
            total: 0,
            included: 0,
            truncated: false,
          },
          rows: [],
          textTruncated: false,
        },
      };

      const plan = {
        schemaVersion: 1,
        type: 'AI_MODIFICATION_PLAN',
        pageId: 'page-1',
        status: 'PLAN_READY',
        summary: 'Add a note to the page.',
        operations: [
          {
            type: 'INSERT_BLOCKS',
            parentBlockId: null,
            afterBlockId: null,
            blocks: [
              {
                type: 'TEXT',
                content: {
                  text: 'Release note',
                },
              },
            ],
          },
        ],
      };

      const post = jest.fn().mockReturnValue(
        of({
          data: {
            result: plan,
            provider: 'ollama',
            model: 'qwen3:4b-instruct',
            usage: {
              prompt_tokens: 200,
              completion_tokens: 70,
              total_tokens: 270,
            },
          },
        }),
      );

      const adapter = new FastApiAiRuntimeAdapter(
        {
          post,
        } as unknown as HttpService,
        new ConfigService({
          AI_SERVICE_BASE_URL: 'http://ai.test',
          AI_INTERNAL_TOKEN: 'test-token',
        }),
      );

      const result = await adapter.execute({
        requestId: 'request-modification-1',
        capability: AI_MODIFICATION_PLAN_CAPABILITY,
        content: 'Thêm một ghi chú release vào page.',
        input: {},
        context,
      });

      expect(post).toHaveBeenCalledTimes(1);

      expect(post).toHaveBeenCalledWith(
        'http://ai.test/internal/v1/modification-planner',
        {
          instruction: 'Thêm một ghi chú release vào page.',
          context,
        },
        {
          timeout: 65000,
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Service-Token': 'test-token',
          },
        },
      );

      expect(result).toEqual({
        output: plan,
        provider: 'ollama',
        model: 'qwen3:4b-instruct',
        usage: {
          promptTokens: 200,
          completionTokens: 70,
          totalTokens: 270,
        },
      });
    });

    it('succeeds without usage when modification planner usage is absent', async () => {
      const plan = {
        schemaVersion: 1,
        type: 'AI_MODIFICATION_PLAN',
        pageId: 'page-1',
        status: 'NEED_MORE_CONTEXT',
        summary: 'More context is required.',
        operations: [],
        contextRequests: [
          {
            reason: 'AMBIGUOUS_TARGET',
            description: 'The requested target cannot be identified.',
          },
        ],
      };

      const post = jest.fn().mockReturnValue(
        of({
          data: {
            result: plan,
            provider: 'ollama',
            model: 'qwen3:4b-instruct',
          },
        }),
      );

      const adapter = new FastApiAiRuntimeAdapter(
        {
          post,
        } as unknown as HttpService,
        new ConfigService({
          AI_SERVICE_BASE_URL: 'http://ai.test',
          AI_INTERNAL_TOKEN: 'test-token',
        }),
      );

      const result = await adapter.execute({
        requestId: 'request-modification-2',
        capability: AI_MODIFICATION_PLAN_CAPABILITY,
        content: 'Cập nhật phần phù hợp.',
        input: {},
        context: {
          page: {
            id: 'page-1',
          },
        },
      });

      expect(result).toEqual({
        output: plan,
        provider: 'ollama',
        model: 'qwen3:4b-instruct',
      });

      expect(result).not.toHaveProperty('usage');
    });

    it('rejects an empty modification planner instruction', async () => {
      const post = jest.fn();

      const adapter = new FastApiAiRuntimeAdapter(
        {
          post,
        } as unknown as HttpService,
        new ConfigService({
          AI_SERVICE_BASE_URL: 'http://ai.test',
          AI_INTERNAL_TOKEN: 'test-token',
        }),
      );

      await expect(
        adapter.execute({
          requestId: 'request-modification-3',
          capability: AI_MODIFICATION_PLAN_CAPABILITY,
          content: '   ',
          input: {},
          context: {
            page: {
              id: 'page-1',
            },
          },
        }),
      ).rejects.toThrow(
        new BadRequestException('AI modification plan instruction is required'),
      );

      expect(post).not.toHaveBeenCalled();
    });

    it('rejects a modification planner request without context', async () => {
      const post = jest.fn();

      const adapter = new FastApiAiRuntimeAdapter(
        {
          post,
        } as unknown as HttpService,
        new ConfigService({
          AI_SERVICE_BASE_URL: 'http://ai.test',
          AI_INTERNAL_TOKEN: 'test-token',
        }),
      );

      await expect(
        adapter.execute({
          requestId: 'request-modification-4',
          capability: AI_MODIFICATION_PLAN_CAPABILITY,
          content: 'Thêm một task.',
          input: {},
        }),
      ).rejects.toThrow(
        new BadRequestException('AI modification plan context is required'),
      );

      expect(post).not.toHaveBeenCalled();
    });

    it('rejects a non-object modification planner result', async () => {
      const adapter = new FastApiAiRuntimeAdapter(
        {
          post: jest.fn().mockReturnValue(
            of({
              data: {
                result: 'invalid',
                provider: 'ollama',
                model: 'qwen3:4b-instruct',
              },
            }),
          ),
        } as unknown as HttpService,
        new ConfigService({
          AI_SERVICE_BASE_URL: 'http://ai.test',
          AI_INTERNAL_TOKEN: 'test-token',
        }),
      );

      await expect(
        adapter.execute({
          requestId: 'request-modification-5',
          capability: AI_MODIFICATION_PLAN_CAPABILITY,
          content: 'Thêm một task.',
          input: {},
          context: {
            page: {
              id: 'page-1',
            },
          },
        }),
      ).rejects.toThrow(
        new BadGatewayException('AI service returned an invalid response'),
      );
    });
  });
});
