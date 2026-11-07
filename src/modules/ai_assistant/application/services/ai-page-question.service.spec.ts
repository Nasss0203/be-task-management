import { PayloadTooLargeException } from '@nestjs/common';
import { AiConversation } from '../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiConversationScope } from '../../domain/enums/ai-conversation-scope.enum';
import type { AiMessage } from '../../domain/entities/ai-message.entity';
import {
  AiPageQuestionService,
  type AskPageQuestionInput,
} from './ai-page-question.service';

const page = (pageId: string, title: string) => ({
  pageId,
  workspaceId: 'workspace-1',
  title,
  parentPageId: null,
  teamspaceId: null,
});

function fixture() {
  const resolver = {
    resolve: jest
      .fn()
      .mockResolvedValue({ status: 'NOT_FOUND', candidates: [] }),
    resolveFromSentence: jest
      .fn()
      .mockResolvedValue({ status: 'NOT_FOUND', candidates: [] }),
    resolveSimilarTitles: jest
      .fn()
      .mockResolvedValue({ status: 'NOT_FOUND', candidates: [] }),
  };
  const contextHandler = {
    execute: jest.fn().mockResolvedValue({
      page: { id: 'page-1', title: 'Hội họp tuần' },
      databases: [],
    }),
  };
  const runtime = {
    answerPageQuestion: jest.fn().mockResolvedValue({
      answer: 'Trang "Hội họp tuần" còn 3 việc chưa xong',
      usedModel: false,
      facts: {},
      provider: 'deterministic',
      model: 'rules',
    }),
  };
  const conversations = {
    save: jest.fn((conversation: AiConversation) =>
      Promise.resolve(conversation),
    ),
  };
  const saved: AiMessage[] = [];
  const messages = {
    save: jest.fn((message: AiMessage) => {
      saved.push(message);
      return Promise.resolve(message);
    }),
  };
  const unitOfWork = {
    runInTransaction: jest.fn((work: (context: unknown) => unknown) =>
      Promise.resolve(work('tx')),
    ),
  };
  const service = new AiPageQuestionService(
    resolver as never,
    contextHandler as never,
    runtime as never,
    conversations as never,
    messages as never,
    unitOfWork as never,
  );
  const input: AskPageQuestionInput = {
    userId: 'actor',
    workspaceId: 'workspace-1',
    requestId: 'request-1',
    instruction: 'trang Hội họp tuần còn việc nào chưa xong?',
    questionKind: 'TODO_STATUS',
    pageReference: 'Hội họp tuần',
    databaseReference: null,
    conversation: null,
  };
  return {
    service,
    resolver,
    contextHandler,
    runtime,
    conversations,
    messages,
    saved,
    input,
  };
}

describe('AiPageQuestionService (AI-Q1)', () => {
  it('answers from the Page found by its title and keeps both messages', async () => {
    const f = fixture();
    f.resolver.resolve.mockResolvedValue({
      status: 'RESOLVED',
      page: page('page-1', 'Hội họp tuần'),
      resolutionMethod: 'EXACT_TITLE',
      confidence: 1,
    });
    const outcome = await f.service.answer(f.input);
    expect(outcome).toMatchObject({
      status: 'ANSWERED',
      answer: 'Trang "Hội họp tuần" còn 3 việc chưa xong',
      page: { pageId: 'page-1' },
      conversationSwitched: false,
    });
    expect(f.contextHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'actor', pageId: 'page-1' }),
    );
    expect(f.runtime.answerPageQuestion).toHaveBeenCalledWith(
      expect.objectContaining({ questionKind: 'TODO_STATUS' }),
    );
    const conversation = f.conversations.save.mock.calls[0][0];
    expect(conversation.getScope()).toBe(AiConversationScope.PAGE);
    expect(conversation.getPageId()).toBe('page-1');
    expect(f.saved.map((message) => message.getRole())).toEqual([
      'USER',
      'ASSISTANT',
    ]);
    expect(f.saved[1].getContent()).toBe(
      'Trang "Hội họp tuần" còn 3 việc chưa xong',
    );
  });

  it('reuses the PAGE conversation of the same Page', async () => {
    const f = fixture();
    f.resolver.resolve.mockResolvedValue({
      status: 'RESOLVED',
      page: page('page-1', 'Hội họp tuần'),
      resolutionMethod: 'EXACT_TITLE',
      confidence: 1,
    });
    const existing = AiConversation.create({
      userId: 'actor',
      workspaceId: 'workspace-1',
      scope: AiConversationScope.PAGE,
      pageId: 'page-1',
      title: 'old',
    });
    const outcome = await f.service.answer({
      ...f.input,
      conversation: existing,
    });
    expect(f.conversations.save).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({
      conversationId: existing.getId(),
      conversationSwitched: false,
    });
  });

  it('opens a PAGE conversation when a GLOBAL one was sent', async () => {
    const f = fixture();
    f.resolver.resolve.mockResolvedValue({
      status: 'RESOLVED',
      page: page('page-1', 'Hội họp tuần'),
      resolutionMethod: 'EXACT_TITLE',
      confidence: 1,
    });
    const global = AiConversation.create({
      userId: 'actor',
      workspaceId: 'workspace-1',
      scope: AiConversationScope.GLOBAL,
      title: 'chat',
    });
    const outcome = await f.service.answer({
      ...f.input,
      conversation: global,
    });
    expect(outcome).toMatchObject({ conversationSwitched: true });
  });

  it('offers duplicates for a choice and answers the chosen one', async () => {
    const f = fixture();
    const candidates = [page('page-1', 'Họp'), page('page-2', 'Họp')];
    f.resolver.resolve.mockResolvedValue({ status: 'AMBIGUOUS', candidates });
    await expect(f.service.answer(f.input)).resolves.toEqual({
      status: 'AMBIGUOUS_PAGE',
      candidates,
    });
    expect(f.runtime.answerPageQuestion).not.toHaveBeenCalled();
    const chosen = await f.service.answer({
      ...f.input,
      selectedPageId: 'page-2',
    });
    expect(chosen).toMatchObject({
      status: 'ANSWERED',
      page: { pageId: 'page-2' },
    });
    await expect(
      f.service.answer({ ...f.input, selectedPageId: 'page-9' }),
    ).resolves.toEqual({ status: 'PAGE_NOT_FOUND', name: null });
  });

  it('falls back to titles in the sentence, then to close titles', async () => {
    const f = fixture();
    f.resolver.resolveFromSentence.mockResolvedValueOnce({
      status: 'CANDIDATES',
      candidates: [page('page-3', 'sub man')],
      resolutionMethod: 'TITLE_IN_SENTENCE',
    });
    await expect(
      f.service.answer({ ...f.input, pageReference: 'Sub-man notes' }),
    ).resolves.toMatchObject({
      status: 'AMBIGUOUS_PAGE',
      resolutionMethod: 'TITLE_IN_SENTENCE',
    });
    f.resolver.resolveSimilarTitles.mockResolvedValueOnce({
      status: 'CANDIDATES',
      candidates: [page('page-4', 'Hội họp tuần 2')],
      resolutionMethod: 'FUZZY_TITLE',
    });
    await expect(f.service.answer(f.input)).resolves.toMatchObject({
      status: 'AMBIGUOUS_PAGE',
      resolutionMethod: 'FUZZY_TITLE',
    });
    await expect(f.service.answer(f.input)).resolves.toEqual({
      status: 'PAGE_NOT_FOUND',
      name: 'Hội họp tuần',
    });
  });

  it('answers the one Page whose title starts the name read', async () => {
    const f = fixture();
    f.resolver.resolveFromSentence.mockResolvedValueOnce({
      status: 'CANDIDATES',
      candidates: [page('page-1', 'Hội họp tuần')],
      resolutionMethod: 'TITLE_IN_SENTENCE',
    });
    await expect(
      f.service.answer({
        ...f.input,
        instruction: 'trang Hội họp tuần họp lúc mấy giờ?',
        questionKind: 'FREE',
        pageReference: 'Hội họp tuần họp lúc',
      }),
    ).resolves.toMatchObject({
      status: 'ANSWERED',
      page: { pageId: 'page-1' },
    });
  });

  it('answers the one Page whose title goes on past the name read', async () => {
    const f = fixture();
    f.resolver.resolveFromSentence.mockResolvedValueOnce({
      status: 'CANDIDATES',
      candidates: [page('page-5', 'Cho thuê nhà')],
      resolutionMethod: 'TITLE_IN_SENTENCE',
    });
    await expect(
      f.service.answer({
        ...f.input,
        instruction: 'tóm tắt trang Cho thuê nhà',
        questionKind: 'SUMMARY',
        pageReference: 'Cho thuê',
      }),
    ).resolves.toMatchObject({
      status: 'ANSWERED',
      page: { pageId: 'page-5' },
    });
  });

  it('still offers a choice when two Pages start with the name read', async () => {
    const f = fixture();
    f.resolver.resolveFromSentence.mockResolvedValueOnce({
      status: 'CANDIDATES',
      candidates: [
        page('page-5', 'Cho thuê nhà'),
        page('page-6', 'Cho thuê xe'),
      ],
      resolutionMethod: 'TITLE_IN_SENTENCE',
    });
    await expect(
      f.service.answer({
        ...f.input,
        instruction: 'tóm tắt trang Cho thuê nhà và Cho thuê xe',
        questionKind: 'SUMMARY',
        pageReference: 'Cho thuê',
      }),
    ).resolves.toMatchObject({ status: 'AMBIGUOUS_PAGE' });
  });

  it('never takes a Page that only shares the first words', async () => {
    const f = fixture();
    f.resolver.resolveFromSentence.mockResolvedValueOnce({
      status: 'CANDIDATES',
      candidates: [page('page-7', 'Cho thuê nhà')],
      resolutionMethod: 'TITLE_IN_SENTENCE',
    });
    await expect(
      f.service.answer({
        ...f.input,
        instruction: 'tóm tắt trang Cho thuê xe, có nhắc Cho thuê nhà',
        questionKind: 'SUMMARY',
        pageReference: 'Cho thuê xe',
      }),
    ).resolves.toMatchObject({ status: 'AMBIGUOUS_PAGE' });
  });

  it('uses the open Page for a question without a name', async () => {
    const f = fixture();
    f.resolver.resolve.mockResolvedValue({
      status: 'RESOLVED',
      page: page('page-1', 'Hội họp tuần'),
      resolutionMethod: 'CURRENT_CONTEXT',
      confidence: 1,
    });
    const outcome = await f.service.answer({
      ...f.input,
      instruction: 'còn việc nào chưa xong?',
      pageReference: null,
      currentPageId: 'page-1',
    });
    expect(outcome.status).toBe('ANSWERED');
    expect(f.resolver.resolve).toHaveBeenCalledWith(
      expect.objectContaining({ currentPageId: 'page-1' }),
    );
    await expect(
      f.service.answer({ ...f.input, pageReference: null }),
    ).resolves.toEqual({ status: 'NEEDS_PAGE' });
  });

  it('reads a table on the open Page before a Page with its name', async () => {
    const f = fixture();
    f.resolver.resolve.mockResolvedValue({
      status: 'RESOLVED',
      page: page('page-1', 'Hội họp tuần'),
      resolutionMethod: 'CURRENT_CONTEXT',
      confidence: 1,
    });
    f.contextHandler.execute.mockResolvedValue({
      page: { id: 'page-1' },
      databases: [{ name: 'Tasks' }],
    });
    const outcome = await f.service.answer({
      ...f.input,
      instruction: 'bảng tasks có bao nhiêu việc Done?',
      questionKind: 'DATABASE_COUNT',
      pageReference: null,
      databaseReference: 'tasks',
      currentPageId: 'page-1',
    });
    expect(outcome.status).toBe('ANSWERED');
    expect(f.resolver.resolve).toHaveBeenCalledTimes(1);
    expect(f.contextHandler.execute).toHaveBeenCalledTimes(1);
    expect(f.runtime.answerPageQuestion).toHaveBeenCalledWith(
      expect.objectContaining({ databaseReference: 'tasks' }),
    );
  });

  it('tells a Page over the context limit apart and saves nothing', async () => {
    const f = fixture();
    f.resolver.resolve.mockResolvedValue({
      status: 'RESOLVED',
      page: page('page-1', 'Hội họp tuần'),
      resolutionMethod: 'EXACT_TITLE',
      confidence: 1,
    });
    f.contextHandler.execute.mockRejectedValue(
      new PayloadTooLargeException('too many blocks'),
    );
    await expect(f.service.answer(f.input)).resolves.toEqual({
      status: 'PAGE_TOO_LONG',
    });
    expect(f.messages.save).not.toHaveBeenCalled();
  });
});
