import type { HttpService } from '@nestjs/axios';
import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

import { FastApiAiRuntimeAdapter } from './fast-api-ai-runtime.adapter';

jest.mock('@nestjs/axios', () => ({
  HttpService: jest.fn(),
}));

function adapterReturning(data: unknown) {
  const post = jest.fn().mockReturnValue(of({ data }));
  const adapter = new FastApiAiRuntimeAdapter(
    { post } as unknown as HttpService,
    new ConfigService({
      AI_SERVICE_BASE_URL: 'http://ai.test',
      AI_INTERNAL_TOKEN: 'test-token',
    }),
  );
  return { adapter, post };
}

const question = {
  intent: 'PAGE_QUESTION',
  writingAction: null,
  language: null,
  needsClarification: false,
  questionKind: 'TODO_STATUS',
  pageReference: 'Hội họp tuần',
  databaseReference: null,
};

describe('FastApiAiRuntimeAdapter page questions (AI-Q1)', () => {
  const sentence = 'trang Hội họp tuần còn việc nào chưa xong?';

  it('accepts a PAGE_QUESTION with names from the sentence', async () => {
    const { adapter } = adapterReturning({
      result: question,
      provider: 'deterministic',
      model: 'intent-rules-v1',
    });
    await expect(adapter.classify({ instruction: sentence })).resolves.toEqual(
      expect.objectContaining({ result: question }),
    );
  });

  it.each([
    ['an unknown kind', { questionKind: 'DELETE_PAGE' }],
    ['a name not in the sentence', { pageReference: 'Trang khác' }],
    ['a clarification flag', { needsClarification: true }],
    ['a missing key', { databaseReference: undefined }],
  ])('refuses %s', async (_label, change) => {
    const { adapter } = adapterReturning({
      result: JSON.parse(JSON.stringify({ ...question, ...change })) as unknown,
      provider: 'deterministic',
      model: 'intent-rules-v1',
    });
    await expect(adapter.classify({ instruction: sentence })).rejects.toThrow(
      BadGatewayException,
    );
  });

  it('refuses question keys on other intents', async () => {
    const { adapter } = adapterReturning({
      result: { ...question, intent: 'OTHER' },
      provider: 'deterministic',
      model: 'intent-rules-v1',
    });
    await expect(adapter.classify({ instruction: sentence })).rejects.toThrow(
      BadGatewayException,
    );
  });

  it('posts the question with the context and checks the answer', async () => {
    const answer = {
      answer: 'Trang "Hội họp tuần" còn 3 việc chưa xong',
      usedModel: false,
      facts: { todoOpen: 3 },
      provider: 'deterministic',
      model: 'page-question-rules-v1',
    };
    const { adapter, post } = adapterReturning(answer);
    await expect(
      adapter.answerPageQuestion({
        question: sentence,
        questionKind: 'TODO_STATUS',
        databaseReference: null,
        context: { page: { id: 'page-1' } },
      }),
    ).resolves.toEqual(answer);
    expect(post).toHaveBeenCalledWith(
      'http://ai.test/internal/v1/page-question',
      {
        question: sentence,
        questionKind: 'TODO_STATUS',
        context: { page: { id: 'page-1' } },
      },
      expect.anything(),
    );
  });

  it('refuses an answer with extra keys or no text', async () => {
    for (const data of [
      { answer: ' ', usedModel: false, facts: {}, provider: 'p', model: 'm' },
      {
        answer: 'ok',
        usedModel: false,
        facts: {},
        provider: 'p',
        model: 'm',
        operations: [],
      },
    ]) {
      const { adapter } = adapterReturning(data);
      await expect(
        adapter.answerPageQuestion({
          question: sentence,
          questionKind: 'TODO_STATUS',
          context: {},
        }),
      ).rejects.toThrow(BadGatewayException);
    }
  });
});
