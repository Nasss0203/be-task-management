import { AiPageInstructionPlannerService } from './ai-page-instruction-planner.service';
import { AiModificationPlannerService } from './ai-modification-planner.service';
import { PageIntentExtractionService } from '../resolution/page-intent-extraction.service';
import { PageReferenceResolver } from '../resolution/page-reference-resolver.service';

describe('D-87: a command clause that is not first in the sentence', () => {
  const extract = jest.fn();
  const resolve = jest.fn();
  const plan = jest.fn();
  const service = new AiPageInstructionPlannerService(
    { extract } as unknown as PageIntentExtractionService,
    {
      resolve,
      resolveFromSentence: jest.fn(),
      resolveSimilarTitles: jest.fn(),
    } as unknown as PageReferenceResolver,
    { generate: plan } as unknown as AiModificationPlannerService,
  );
  const page = {
    pageId: 'page-1',
    workspaceId: 'workspace-1',
    title: 'Ôn thi cuối kỳ',
    parentPageId: null,
    teamspaceId: null,
  };
  const run = (sentence: string, command: string) => {
    extract.mockResolvedValue({
      result: {
        intent: 'MODIFY_PAGE',
        referenceType: 'TITLE',
        pageReference: 'Ôn thi cuối kỳ',
        instruction: command,
        needsClarification: false,
      },
    });
    return service.generate({
      userId: 'actor-1',
      workspaceId: 'workspace-1',
      requestId: 'request-1',
      instruction: sentence,
    });
  };

  beforeEach(() => {
    jest.resetAllMocks();
    resolve.mockResolvedValue({
      status: 'RESOLVED',
      page,
      resolutionMethod: 'EXACT_TITLE',
      confidence: 1,
    });
    plan.mockResolvedValue({
      pageId: 'page-1',
      status: 'PLAN_READY',
      generationId: 'generation-1',
      conversationId: 'conversation-1',
    });
  });

  it.each([
    [
      'việc chuẩn bị tài liệu họp thì thêm vào trang Ôn thi cuối kỳ nhé',
      'thêm việc chuẩn bị tài liệu họp',
    ],
    ['nhớ tích in tài liệu ở trang Ôn thi cuối kỳ', 'tích in tài liệu'],
    [
      'Gieo hạt cải ngọt ở trang Ôn thi cuối kỳ thừa rồi, bỏ đi nhé',
      'xoá Gieo hạt cải ngọt',
    ],
  ])(
    'plans "%s" from the command made of its own words',
    async (sentence, command) => {
      const result = await run(sentence, command);
      expect(result.status).toBe('PLAN_GENERATED');
      expect(plan).toHaveBeenCalledWith(
        expect.objectContaining({
          instruction: command,
          originalInstruction: sentence,
          requireRuleDraft: true,
        }),
      );
    },
  );

  it('keeps the usual path for a sentence the grammar already reads', async () => {
    const result = await run(
      'trang Ôn thi cuối kỳ có việc Gom thùng carton xong rồi',
      'tích Gom thùng carton',
    );
    expect(result.status).toBe('PLAN_GENERATED');
    expect(plan).toHaveBeenCalledWith(
      expect.not.objectContaining({ requireRuleDraft: true }),
    );
  });

  it('refuses a command holding words the sentence does not have', async () => {
    const result = await run(
      'việc chuẩn bị tài liệu họp thì thêm vào trang Ôn thi cuối kỳ nhé',
      'thêm việc mua sữa',
    );
    expect(result.status).toBe('UNSUPPORTED_OPERATION');
    expect(plan).not.toHaveBeenCalled();
  });

  it('refuses a canonical verb the sentence gives no reason for', async () => {
    const result = await run(
      'việc chuẩn bị tài liệu họp thì thêm vào trang Ôn thi cuối kỳ nhé',
      'xoá việc chuẩn bị tài liệu họp',
    );
    expect(result.status).toBe('UNSUPPORTED_OPERATION');
    expect(plan).not.toHaveBeenCalled();
  });

  it('refuses deleting a whole Page with a word between verb and Page', async () => {
    const result = await run(
      'xoá luôn trang Ôn thi cuối kỳ đi',
      'xoá Ôn thi cuối kỳ',
    );
    expect(result.status).toBe('UNSUPPORTED_OPERATION');
    expect(plan).not.toHaveBeenCalled();
  });

  it('still plans deleting an item with "luôn" in the sentence', async () => {
    const result = await run(
      'Gieo hạt cải ngọt ở trang Ôn thi cuối kỳ thừa rồi, xoá luôn nhé',
      'xoá Gieo hạt cải ngọt',
    );
    expect(result.status).toBe('PLAN_GENERATED');
  });

  it('refuses the command path for a sentence that names a source', async () => {
    extract.mockResolvedValue({
      result: {
        intent: 'MODIFY_PAGE',
        referenceType: 'TITLE',
        pageReference: 'Ôn thi cuối kỳ',
        instruction: 'thêm việc chuẩn bị tài liệu họp',
        basedOn: 'trang Ghi chú họp',
        needsClarification: false,
      },
    });
    const result = await service.generate({
      userId: 'actor-1',
      workspaceId: 'workspace-1',
      requestId: 'request-1',
      instruction:
        'việc chuẩn bị tài liệu họp thì thêm vào trang Ôn thi cuối kỳ dựa trên trang Ghi chú họp',
    });
    expect(result.status).toBe('UNSUPPORTED_OPERATION');
    expect(plan).not.toHaveBeenCalled();
  });

  it('still refuses an action on a whole Page in the sentence', async () => {
    const result = await run(
      'việc chuẩn bị tài liệu họp thì thêm vào trang Ôn thi cuối kỳ rồi chia sẻ trang Ôn thi cuối kỳ',
      'thêm việc chuẩn bị tài liệu họp',
    );
    expect(result.status).toBe('UNSUPPORTED_OPERATION');
    expect(plan).not.toHaveBeenCalled();
  });
});
