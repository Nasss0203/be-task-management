import { UnprocessableEntityException } from '@nestjs/common';
import { passThroughAskLog } from '../ask-log/ai-ask-event-recorder.fixture';
import { AiAskService } from './ai-ask.service';

describe('AiAskService page questions (AI-Q1)', () => {
  function fixture(outcome: unknown) {
    const classify = jest.fn().mockResolvedValue({
      result: {
        intent: 'PAGE_QUESTION',
        writingAction: null,
        language: null,
        needsClarification: false,
        questionKind: 'TODO_STATUS',
        pageReference: 'Hội họp tuần',
        databaseReference: null,
      },
      provider: 'deterministic',
      model: 'rules',
    });
    const planner = { generate: jest.fn() };
    const assistant = { submit: jest.fn() };
    const questions = {
      answer:
        outcome instanceof Error
          ? jest.fn().mockRejectedValue(outcome)
          : jest.fn().mockResolvedValue(outcome),
    };
    const service = new AiAskService(
      { classify } as never,
      { assertWorkspaceRead: jest.fn() } as never,
      { findByIdAndUserId: jest.fn() } as never,
      { execute: jest.fn() } as never,
      assistant as never,
      planner as never,
      passThroughAskLog(),
      undefined,
      questions as never,
    );
    const input = {
      userId: 'actor',
      workspaceId: 'workspace-1',
      requestId: 'request-1',
      instruction: 'trang Hội họp tuần còn việc nào chưa xong?',
    };
    return { service, questions, planner, assistant, input };
  }

  it('returns the answer without a draft', async () => {
    const f = fixture({
      status: 'ANSWERED',
      answer: 'Trang "Hội họp tuần" còn 3 việc chưa xong',
      page: { pageId: 'page-1', title: 'Hội họp tuần' },
      conversationId: 'conversation-1',
      conversationSwitched: false,
      usedModel: false,
    });
    await expect(f.service.ask(f.input)).resolves.toEqual({
      requestId: 'request-1',
      intent: 'PAGE_QUESTION',
      status: 'ANSWERED',
      capability: 'PAGE_QUESTION',
      reason: 'TODO_STATUS',
      conversationId: 'conversation-1',
      page: { pageId: 'page-1', title: 'Hội họp tuần' },
      usedModel: false,
      assistantMessage: 'Trang "Hội họp tuần" còn 3 việc chưa xong',
    });
    expect(f.questions.answer).toHaveBeenCalledWith(
      expect.objectContaining({
        questionKind: 'TODO_STATUS',
        pageReference: 'Hội họp tuần',
        databaseReference: null,
      }),
    );
    expect(f.planner.generate).not.toHaveBeenCalled();
    expect(f.assistant.submit).not.toHaveBeenCalled();
  });

  it('offers Pages to choose from', async () => {
    const candidates = [
      {
        pageId: 'page-1',
        workspaceId: 'workspace-1',
        title: 'Họp',
        parentPageId: null,
        teamspaceId: null,
      },
    ];
    const f = fixture({
      status: 'AMBIGUOUS_PAGE',
      candidates,
      resolutionMethod: 'TITLE_IN_SENTENCE',
    });
    await expect(f.service.ask(f.input)).resolves.toMatchObject({
      status: 'AMBIGUOUS_PAGE',
      intent: 'PAGE_QUESTION',
      capability: 'PAGE_QUESTION',
      candidates,
      resolutionMethod: 'TITLE_IN_SENTENCE',
      assistantMessage: 'Ý bạn là trang "Họp"? Chọn trang để AI trả lời:',
    });
  });

  it.each([
    [
      { status: 'PAGE_NOT_FOUND', name: 'Hội họp tuần' },
      'PAGE_NOT_FOUND',
      'Hội họp tuần',
    ],
    [{ status: 'NEEDS_PAGE' }, 'UNRESOLVED_PAGE', 'Bạn muốn hỏi trang nào?'],
    [{ status: 'PAGE_TOO_LONG' }, 'PAGE_TOO_LONG', 'quá dài'],
    [
      new UnprocessableEntityException('WRITING_NOT_DONE'),
      'WRITING_NOT_DONE',
      'chưa trả lời chắc chắn',
    ],
  ])('explains %p as feedback', async (outcome, reason, words) => {
    const f = fixture(outcome);
    const response = await f.service.ask(f.input);
    expect(response).toMatchObject({
      status: 'NEEDS_CLARIFICATION',
      reason,
      capability: null,
    });
    expect(response.assistantMessage).toContain(words);
  });
});
