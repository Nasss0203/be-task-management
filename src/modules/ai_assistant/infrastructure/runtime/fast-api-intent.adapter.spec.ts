import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  GatewayTimeoutException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { FastApiAiRuntimeAdapter } from './fast-api-ai-runtime.adapter';

jest.mock('@nestjs/axios', () => ({ HttpService: jest.fn() }));

describe('FastAPI M0 intent contract', () => {
  const post = jest.fn<unknown, [string, unknown, unknown]>();
  const adapter = new FastApiAiRuntimeAdapter(
    { post } as unknown as HttpService,
    new ConfigService({
      AI_SERVICE_BASE_URL: 'http://ai.test',
      AI_INTERNAL_TOKEN: 'private-test-token',
      AI_SERVICE_TIMEOUT_MS: '1234',
    }),
  );
  const result = {
    intent: 'CREATE_PAGE',
    writingAction: null,
    language: null,
    needsClarification: false,
  };
  const envelope = (value: unknown) => ({
    result: value,
    provider: 'deterministic',
    model: 'intent-rules-v1',
  });
  beforeEach(() => jest.resetAllMocks());

  it.each(['CREATE_PAGE', 'MODIFY_PAGE', 'OTHER', 'UNCLEAR'])(
    'accepts %s with exact fields',
    async (intent) => {
      const body = envelope({
        ...result,
        intent,
        needsClarification: intent === 'UNCLEAR',
      });
      post.mockReturnValue(of({ data: body }));
      expect(await adapter.classify({ instruction: 'instruction' })).toEqual(
        body,
      );
      expect(post).toHaveBeenCalledWith(
        'http://ai.test/internal/v1/intent',
        { instruction: 'instruction' },
        {
          timeout: 1234,
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Service-Token': 'private-test-token',
          },
        },
      );
    },
  );
  it.each([
    'IMPROVE',
    'SHORTEN',
    'EXPAND',
    'SUMMARIZE',
    'CONTINUE',
    'TRANSLATE',
  ])('accepts Writing %s', async (writingAction) => {
    post.mockReturnValue(
      of({
        data: envelope({
          ...result,
          intent: 'WRITING',
          writingAction,
          language: writingAction === 'TRANSLATE' ? 'Vietnamese' : null,
        }),
      }),
    );
    await expect(
      adapter.classify({ instruction: 'source' }),
    ).resolves.toBeDefined();
  });
  it.each([
    { ...result, intent: 'DELETE_PAGE' },
    { ...result, pageId: 'hallucinated' },
    { ...result, instruction: 'editing instruction' },
    { ...result, needsClarification: 'false' },
    { ...result, writingAction: 'IMPROVE' },
    { ...result, language: 'English' },
    { ...result, intent: 'WRITING', writingAction: 'FORMAT' },
    { ...result, intent: 'WRITING', writingAction: null },
    {
      ...result,
      intent: 'WRITING',
      writingAction: 'IMPROVE',
      language: 'English',
    },
    { ...result, intent: 'WRITING', writingAction: 'TRANSLATE', language: '' },
    { ...result, intent: 'WRITING', writingAction: 'TRANSLATE', language: 123 },
    { intent: 'CREATE_PAGE', writingAction: null, language: null },
    { ...result, intent: 'UNCLEAR', needsClarification: false },
  ])('rejects invalid nested contract %j', async (value) => {
    post.mockReturnValue(of({ data: envelope(value) }));
    await expect(adapter.classify({ instruction: 'source' })).rejects.toThrow(
      BadGatewayException,
    );
  });
  it.each([
    null,
    [],
    { ...envelope(result), extra: true },
    { result },
    { ...envelope(result), model: null },
  ])('rejects invalid envelope %j', async (data) => {
    post.mockReturnValue(of({ data }));
    await expect(adapter.classify({ instruction: 'source' })).rejects.toThrow(
      BadGatewayException,
    );
  });
  it.each([401, 422, 502, 503, 504])(
    'preserves existing upstream HTTP %s -> 502 mapping',
    async (status) => {
      post.mockReturnValue(
        throwError(() => ({
          isAxiosError: true,
          response: { status, data: 'sensitive' },
        })),
      );
      await expect(
        adapter.classify({ instruction: 'private-source' }),
      ).rejects.toThrow(`AI service returned HTTP ${status}`);
    },
  );
  it.each(['ECONNABORTED', 'ETIMEDOUT'])('maps timeout %s', async (code) => {
    post.mockReturnValue(throwError(() => ({ isAxiosError: true, code })));
    await expect(adapter.classify({ instruction: 'source' })).rejects.toThrow(
      GatewayTimeoutException,
    );
  });
  it('maps unavailable without exposing response or source', async () => {
    post.mockReturnValue(
      throwError(() => ({ isAxiosError: true, message: 'private-source' })),
    );
    await expect(
      adapter.classify({ instruction: 'private-source' }),
    ).rejects.toThrow(ServiceUnavailableException);
  });
  it('does not log token, selected text or raw output on contract failure', async () => {
    const spies = [
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined),
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined),
      jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined),
      jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined),
      jest.spyOn(console, 'error').mockImplementation(() => undefined),
      jest.spyOn(console, 'log').mockImplementation(() => undefined),
    ];
    try {
      post.mockReturnValue(of({ data: { raw: 'private-raw-output' } }));
      await expect(
        adapter.classify({
          instruction: 'private-instruction',
          selectedText: 'private-selected-source',
        }),
      ).rejects.toThrow('AI service returned an invalid response');
      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    } finally {
      for (const spy of spies) spy.mockRestore();
    }
  });
  it.each([
    'Thêm checklist',
    'Thêm checklist vào trang này',
    'Trang hiện tại thêm mục tổng kết',
  ])(
    'forwards current Page and accepts source-backed CURRENT_PAGE: %s',
    async (instruction) => {
      post.mockReturnValue(
        of({
          data: envelope({
            intent: 'MODIFY_PAGE',
            referenceType: 'CURRENT_PAGE',
            pageReference: null,
            instruction,
            needsClarification: false,
          }),
        }),
      );
      await expect(
        adapter.extract(instruction, 'current-id'),
      ).resolves.toBeDefined();
      expect(post.mock.calls[0][1]).toEqual({
        instruction,
        currentPageId: 'current-id',
      });
    },
  );
  it.each([
    ['Thêm checklist', undefined],
    ['Thêm checklist vào trang Q4', 'q3'],
    ['Câu hỏi bất kỳ', 'q3'],
  ])(
    'rejects ungrounded CURRENT_PAGE %s',
    async (instruction, currentPageId) => {
      post.mockReturnValue(
        of({
          data: envelope({
            intent: 'MODIFY_PAGE',
            referenceType: 'CURRENT_PAGE',
            pageReference: null,
            instruction,
            needsClarification: false,
          }),
        }),
      );
      await expect(adapter.extract(instruction, currentPageId)).rejects.toThrow(
        BadGatewayException,
      );
    },
  );
});
