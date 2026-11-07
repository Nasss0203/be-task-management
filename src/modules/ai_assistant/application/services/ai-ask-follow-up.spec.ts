import { AiConversation } from '../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiConversationScope } from '../../domain/enums/ai-conversation-scope.enum';
import { passThroughAskLog } from '../ask-log/ai-ask-event-recorder.fixture';
import { AiAskService } from './ai-ask.service';

/** Kế hoạch chat nhiều lượt — câu nhắc lượt trước, through the real Ask flow. */
function fixture(resolution: unknown) {
  const classify = jest.fn().mockResolvedValue({
    result: {
      intent: 'MODIFY_PAGE',
      writingAction: null,
      language: null,
      needsClarification: false,
    },
    provider: 'deterministic',
    model: 'rules',
  });
  const conversation = AiConversation.create({
    id: 'page-conv',
    userId: 'actor',
    workspaceId: 'workspace-1',
    scope: AiConversationScope.PAGE,
    pageId: 'page-1',
  });
  const planner = {
    generate: jest.fn().mockResolvedValue({ status: 'PAGE_NOT_FOUND' }),
  };
  const followUps = {
    resolve: jest.fn().mockResolvedValue(resolution),
    discard: jest.fn(),
  };
  const service = new AiAskService(
    { classify } as never,
    {
      assertWorkspaceRead: jest.fn(),
      getReadablePage: jest.fn(),
      assertCanRead: jest.fn(),
    } as never,
    { findByIdAndUserId: jest.fn().mockResolvedValue(conversation) } as never,
    { execute: jest.fn() } as never,
    { submit: jest.fn() } as never,
    planner as never,
    passThroughAskLog(),
    followUps as never,
  );
  const input = {
    userId: 'actor',
    workspaceId: 'workspace-1',
    requestId: 'request-1',
    instruction: 'xoá nó đi',
    conversationId: 'page-conv',
  };
  return { service, input, classify, planner, followUps };
}

describe('Ask with a sentence about the previous turn', () => {
  it('plans the explicit sentence on the conversation Page', async () => {
    const f = fixture({
      kind: 'SENTENCE',
      instruction: 'xoá "Gọi khách"',
      understood: 'Gọi khách',
    });
    await f.service.ask(f.input);
    expect(f.classify).toHaveBeenCalledWith(
      expect.objectContaining({
        instruction: 'xoá "Gọi khách"',
        currentPageId: 'page-1',
      }),
    );
    expect(f.planner.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        instruction: 'xoá "Gọi khách"',
        currentPageId: 'page-1',
      }),
    );
  });

  it('drops a pending draft and says so', async () => {
    const f = fixture({
      kind: 'DISCARD',
      generationId: 'gen-1',
      message: 'Đã bỏ bản nháp: Thêm 1 to-do',
    });
    expect(await f.service.ask(f.input)).toMatchObject({
      status: 'NEEDS_CLARIFICATION',
      reason: 'DRAFT_DISCARDED',
    });
    expect(f.followUps.discard).toHaveBeenCalledWith(
      'actor',
      'gen-1',
      undefined,
    );
    expect(f.planner.generate).not.toHaveBeenCalled();
  });

  it('asks back without planning when unsure', async () => {
    const f = fixture({ kind: 'ASK', message: 'Mình chưa biết "nó"…' });
    expect(await f.service.ask(f.input)).toMatchObject({
      status: 'NEEDS_CLARIFICATION',
      reason: 'FOLLOW_UP_UNCLEAR',
    });
    expect(f.classify).not.toHaveBeenCalled();
  });
});
