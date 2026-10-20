import type { HttpService } from '@nestjs/axios';
import { BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { FastApiAiRuntimeAdapter } from './fast-api-ai-runtime.adapter';

jest.mock('@nestjs/axios', () => ({ HttpService: jest.fn() }));

describe('FastApiAiRuntimeAdapter page intent', () => {
  const good = {
    result: {
      intent: 'MODIFY_PAGE',
      referenceType: 'TITLE',
      pageReference: 'Release 2.0',
      instruction: 'Thêm checklist QA',
      needsClarification: false,
    },
    provider: 'fake',
    model: 'fake-model',
  };

  function setup(data: unknown) {
    const post = jest.fn().mockReturnValue(of({ data }));
    const adapter = new FastApiAiRuntimeAdapter(
      { post } as unknown as HttpService,
      new ConfigService({
        AI_SERVICE_BASE_URL: 'http://ai.test',
        AI_INTERNAL_TOKEN: 'private-test-token',
      }),
    );
    return { post, adapter };
  }

  it('extracts only, using internal auth and no target id', async () => {
    const { adapter, post } = setup(good);
    await expect(adapter.extract('Thêm checklist QA vào page Release 2.0'))
      .resolves.toEqual(good);
    expect(post).toHaveBeenCalledWith(
      'http://ai.test/internal/v1/page-intent',
      { instruction: 'Thêm checklist QA vào page Release 2.0' },
      {
        timeout: 65000,
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Token': 'private-test-token',
        },
      },
    );
  });

  it.each([
    { ...good, result: { ...good.result, pageId: 'invented' } },
    { ...good, result: { ...good.result, pageReference: 'Invented' } },
    { ...good, result: { ...good.result, needsClarification: true } },
    { ...good, result: { ...good.result, instruction: null } },
    { ...good, result: { ...good.result, referenceType: 'CURRENT_PAGE', pageReference: null } },
    { ...good, provider: null },
    { ...good, unexpected: true },
    null,
  ])('rejects malformed FastAPI response %#', async (value) => {
    await expect(setup(value).adapter.extract('Thêm checklist QA vào page Release 2.0'))
      .rejects.toThrow(BadGatewayException);
  });

  it('permits unresolved target without inventing page id', async () => {
    const unresolved = {
      ...good,
      result: {
        intent: 'MODIFY_PAGE',
        referenceType: 'UNRESOLVED',
        pageReference: null,
        instruction: 'Thêm checklist QA',
        needsClarification: true,
      },
    };
    await expect(setup(unresolved).adapter.extract('Thêm checklist QA vào page hôm qua'))
      .resolves.toEqual(unresolved);
  });
});
