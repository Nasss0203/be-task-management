import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AiConversation } from '../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiConversationScope } from '../../domain/enums/ai-conversation-scope.enum';
import { AiAskService } from './ai-ask.service';

describe('AiAskService', () => {
  function fixture() {
    const classify = jest.fn().mockResolvedValue({
      result: {
        intent: 'CREATE_PAGE',
        writingAction: null,
        language: null,
        needsClarification: false,
      },
      provider: 'deterministic',
      model: 'rules',
    });
    const access = {
      assertWorkspaceRead: jest.fn(),
      getReadablePage: jest
        .fn()
        .mockResolvedValue({ getWorkspaceId: () => 'workspace-1' }),
      assertCanRead: jest.fn(),
    };
    const repository = { findByIdAndUserId: jest.fn() };
    const create = {
      execute: jest.fn().mockResolvedValue({ id: 'new-conversation' }),
    };
    const assistant = {
      submit: jest.fn().mockResolvedValue({
        id: 'generation-1',
        conversation_id: 'new-conversation',
        preview: { title: 'draft' },
        output_data: { text: 'result' },
      }),
    };
    const planner = {
      generate: jest.fn().mockResolvedValue({ status: 'PAGE_NOT_FOUND' }),
    };
    const service = new AiAskService(
      classifyPort(),
      access as never,
      repository as never,
      create as never,
      assistant as never,
      planner as never,
    );
    function classifyPort() {
      return { classify };
    }
    const input = {
      userId: 'actor',
      workspaceId: 'workspace-1',
      requestId: 'request-1',
      instruction: 'Tạo trang Q4',
    };
    function intent(
      intent: string,
      writingAction: string | null = null,
      language: string | null = null,
      needsClarification = false,
    ) {
      classify.mockResolvedValue({
        result: { intent, writingAction, language, needsClarification },
        provider: 'test',
        model: 'test',
      });
    }
    return {
      service,
      classify,
      access,
      repository,
      create,
      assistant,
      planner,
      input,
      intent,
    };
  }
  it('routes CREATE_PAGE to existing composition draft and retains request metadata', async () => {
    const f = fixture();
    const result = await f.service.ask(f.input);
    expect(result).toMatchObject({
      status: 'GENERATION_CREATED',
      intent: 'CREATE_PAGE',
      generationId: 'generation-1',
      capability: 'GENERATE_PAGE_COMPOSITION',
    });
    expect(f.assistant.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        capability: 'GENERATE_PAGE_COMPOSITION',
        requestId: 'request-1',
        content: f.input.instruction,
        metadata: expect.objectContaining({ intent: 'CREATE_PAGE' }) as Record<
          string,
          unknown
        >,
      }),
    );
    expect(f.create.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'actor',
        workspaceId: 'workspace-1',
        scope: 'GLOBAL',
      }),
    );
    expect(f.planner.generate).not.toHaveBeenCalled();
  });
  it.each(['CREATE_PAGE', 'WRITING'])(
    'propagates Submit 403/404 without a successful %s response',
    async (intent) => {
      for (const failure of [
        new ForbiddenException('Page access denied'),
        new NotFoundException('Page not found'),
      ]) {
        const f = fixture();
        f.intent(intent, intent === 'WRITING' ? 'IMPROVE' : null);
        f.assistant.submit.mockRejectedValueOnce(failure);
        await expect(
          f.service.ask({
            ...f.input,
            instruction:
              intent === 'WRITING' ? 'Improve this text' : f.input.instruction,
            selectedText: 'source',
            shareToken: 'token',
          }),
        ).rejects.toBe(failure);
        expect(f.assistant.submit).toHaveBeenCalledWith(
          expect.objectContaining({ shareToken: 'token' }),
        );
        expect(f.planner.generate).not.toHaveBeenCalled();
      }
    },
  );
  it.each(['OTHER', 'UNCLEAR'])(
    'does not generate, persist or plan %s',
    async (intent) => {
      const f = fixture();
      f.intent(intent, null, null, intent === 'UNCLEAR');
      expect(await f.service.ask(f.input)).toMatchObject({
        status:
          intent === 'OTHER' ? 'UNSUPPORTED_REQUEST' : 'NEEDS_CLARIFICATION',
      });
      expect(f.create.execute).not.toHaveBeenCalled();
      expect(f.assistant.submit).not.toHaveBeenCalled();
      expect(f.planner.generate).not.toHaveBeenCalled();
    },
  );
  it('lets the planner look for a real Page when only the Page name is unclear (M1b)', async () => {
    const f = fixture();
    f.intent('MODIFY_PAGE', null, null, true);
    f.planner.generate.mockResolvedValue({
      status: 'NEEDS_CLARIFICATION',
      reason: 'UNRESOLVED_PAGE',
      intent: { pageReference: null },
    });
    const instruction = 'add a QA checklist to sub man page';
    expect(await f.service.ask({ ...f.input, instruction })).toMatchObject({
      status: 'NEEDS_CLARIFICATION',
      assistantMessage: expect.stringContaining(
        'Bạn muốn sửa trang nào?',
      ) as string,
    });
    expect(f.planner.generate).toHaveBeenCalledWith(
      expect.objectContaining({ instruction }),
    );
  });
  it.each([
    [
      [{ title: 'Hội họp tuần' }],
      'Ý bạn là trang "Hội họp tuần"? Chọn trang để tiếp tục:',
    ],
    [
      [{ title: 'sub man' }, { title: 'Sub Man' }],
      'Bạn muốn sửa trang nào? Chọn một trang:',
    ],
  ])(
    'asks the user to pick sentence matches %j',
    async (candidates, message) => {
      const f = fixture();
      f.intent('MODIFY_PAGE', null, null, true);
      f.planner.generate.mockResolvedValue({
        status: 'AMBIGUOUS_PAGE',
        resolutionMethod: 'TITLE_IN_SENTENCE',
        intent: { pageReference: null },
        candidates,
      });
      const result = await f.service.ask({
        ...f.input,
        instruction: 'thêm checklist vào trang hoi hop tuan',
      });
      expect(result).toMatchObject({
        status: 'AMBIGUOUS_PAGE',
        assistantMessage: message,
      });
    },
  );
  it('delegates exact Test 03 unchanged to draft planning without applying', async () => {
    const f = fixture();
    const instruction =
      'Thêm một block văn bản ở cuối trang "sub man" với nội dung: "AI Smoke Test - Đây là nội dung kiểm thử bản nháp, chưa được áp dụng."';
    f.intent('MODIFY_PAGE');
    f.planner.generate.mockResolvedValue({
      status: 'PLAN_GENERATED',
      plan: {
        generationId: 'draft-generation',
        conversationId: 'draft-conversation',
        pageId: 'resolved-page',
        status: 'PLAN_READY',
        operations: [],
      },
    });
    expect(await f.service.ask({ ...f.input, instruction })).toMatchObject({
      status: 'PLAN_GENERATED',
      generationId: 'draft-generation',
    });
    expect(f.planner.generate).toHaveBeenCalledTimes(1);
    expect(f.planner.generate).toHaveBeenCalledWith({
      ...f.input,
      instruction,
    });
    expect(f.access.assertWorkspaceRead).toHaveBeenCalledWith(
      'actor',
      'workspace-1',
    );
    expect(f.create.execute).not.toHaveBeenCalled();
    expect(f.assistant.submit).not.toHaveBeenCalled();
  });
  it.each(['IMPROVE', 'SHORTEN', 'EXPAND', 'SUMMARIZE', 'CONTINUE'])(
    'uses selected data for %s',
    async (action) => {
      const f = fixture();
      f.intent('WRITING', action);
      await f.service.ask({
        ...f.input,
        instruction: 'Xử lý đoạn này',
        selectedText: 'Selected source',
      });
      expect(f.assistant.submit).toHaveBeenCalledWith(
        expect.objectContaining({
          capability: `writing.${action.toLowerCase()}`,
          input: expect.objectContaining({ text: 'Selected source' }) as Record<
            string,
            unknown
          >,
        }),
      );
    },
  );
  it('extracts quoted inline translation text and verifies original target language', async () => {
    const f = fixture();
    f.intent('WRITING', 'TRANSLATE', 'Vietnamese');
    await f.service.ask({
      ...f.input,
      instruction: 'Dịch "Hello" sang tiếng Việt',
    });
    expect(f.assistant.submit).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          text: 'Hello',
          language: 'Vietnamese',
        }) as Record<string, unknown>,
      }),
    );
  });
  it.each([
    ['Tóm tắt đoạn này', 'SUMMARIZE', null],
    ['Dịch "Hello"', 'TRANSLATE', 'Vietnamese'],
    ['Dịch "Hello" sang tiếng Anh', 'TRANSLATE', 'Vietnamese'],
    ['Dịch "Hello" sang tiếng Việt', 'TRANSLATE', null],
    ['Tóm tắt trang "Q4"', 'SUMMARIZE', null],
  ])(
    'asks for missing/ungrounded Writing source or language: %s',
    async (instruction, action, language) => {
      const f = fixture();
      f.intent('WRITING', action, language);
      expect(await f.service.ask({ ...f.input, instruction })).toMatchObject({
        status: 'NEEDS_CLARIFICATION',
      });
      expect(f.assistant.submit).not.toHaveBeenCalled();
      expect(f.create.execute).not.toHaveBeenCalled();
    },
  );
  it('never reads Page content to supply missing Writing text', async () => {
    const f = fixture();
    f.intent('WRITING', 'SUMMARIZE');
    expect(
      await f.service.ask({
        ...f.input,
        instruction: 'Tóm tắt',
        currentPageId: 'page-1',
      }),
    ).toMatchObject({ status: 'NEEDS_CLARIFICATION' });
    expect(f.assistant.submit).not.toHaveBeenCalled();
  });
  it.each([
    [
      { kind: 'BLOCKED_WORD', term: 'chia sẻ', pageAction: false },
      'Hiện tại AI chưa làm được "chia sẻ". Nếu "chia sẻ" là nội dung cần thêm hoặc chữ mới, hãy đặt nó trong ngoặc kép.',
    ],
    [
      { kind: 'BLOCKED_WORD', term: 'đổi tên trang', pageAction: true },
      'Hiện tại AI chưa làm được "đổi tên trang": AI chỉ thay đổi nội dung bên trong trang.',
    ],
    [
      { kind: 'PUNCTUATION', term: '?' },
      'Hãy viết yêu cầu thành một câu lệnh, không dùng dấu "?".',
    ],
    [
      { kind: 'MIXED' },
      'Mỗi câu chỉ một loại việc: hãy gửi riêng từng yêu cầu.',
    ],
    [
      { kind: 'GENERIC' },
      'Hiện tại AI chỉ thêm block, thêm dòng database, tích / bỏ tích to-do, sửa chữ hoặc xoá block có chữ. Mỗi câu chỉ một loại việc, hãy gửi từng yêu cầu riêng.',
    ],
  ])(
    'explains an unsupported request (kế hoạch sửa nhỏ, D3): %j',
    async (detail, message) => {
      const f = fixture();
      f.intent('MODIFY_PAGE');
      f.planner.generate.mockResolvedValue({
        status: 'UNSUPPORTED_OPERATION',
        reason: 'INSERT_ONLY',
        intent: { pageReference: 'Q4' },
        detail,
      });
      expect(
        await f.service.ask({ ...f.input, instruction: 'x trong trang Q4' }),
      ).toMatchObject({
        status: 'UNSUPPORTED_OPERATION',
        assistantMessage: message,
      });
    },
  );

  it('explains a bulk delete (kế hoạch xoá block)', async () => {
    const f = fixture();
    f.intent('MODIFY_PAGE');
    f.planner.generate.mockResolvedValue({
      status: 'UNSUPPORTED_OPERATION',
      reason: 'INSERT_ONLY',
      intent: { pageReference: null },
      detail: { kind: 'BULK' },
    });
    expect(
      await f.service.ask({ ...f.input, instruction: 'xoá hết' }),
    ).toMatchObject({
      assistantMessage:
        'AI chỉ xoá từng block được nêu tên (tối đa 10 block mỗi câu), không xoá hàng loạt.',
    });
  });

  it('relays the planner admission result for unsupported operations (M1b)', async () => {
    // The real gate is covered with the real planner in ai-ask-page-routing.spec.
    const f = fixture();
    f.intent('MODIFY_PAGE');
    f.planner.generate.mockResolvedValue({
      status: 'UNSUPPORTED_OPERATION',
      reason: 'INSERT_ONLY',
      intent: { pageReference: 'Q4' },
    });
    expect(
      await f.service.ask({
        ...f.input,
        instruction: 'Xóa heading trong trang Q4',
      }),
    ).toMatchObject({
      status: 'UNSUPPORTED_OPERATION',
      assistantMessage:
        'Hiện tại AI chỉ thêm block, thêm dòng database, tích / bỏ tích to-do, sửa chữ hoặc xoá block có chữ. Mỗi câu chỉ một loại việc, hãy gửi từng yêu cầu riêng.',
    });
  });

  it.each([
    [
      'sub man',
      'Checklist gồm những mục nào? Gửi lại cả câu kèm các mục, ví dụ: thêm checklist gồm in tài liệu, đặt phòng vào trang "sub man".',
    ],
    [
      null,
      'Checklist gồm những mục nào? Gửi lại cả câu kèm các mục, ví dụ: thêm checklist gồm in tài liệu, đặt phòng vào trang "Kế hoạch Q4".',
    ],
  ])(
    'asks for checklist items (gp02) for Page %s',
    async (pageReference, message) => {
      const f = fixture();
      f.intent('MODIFY_PAGE');
      f.planner.generate.mockResolvedValue({
        status: 'NEEDS_CLARIFICATION',
        reason: 'MISSING_CHECKLIST_ITEMS',
        intent: { pageReference },
      });
      expect(
        await f.service.ask({ ...f.input, instruction: 'thêm checklist' }),
      ).toMatchObject({
        status: 'NEEDS_CLARIFICATION',
        assistantMessage: message,
      });
    },
  );

  it('names the Page found in the sentence when none was extracted (gp02)', async () => {
    const f = fixture();
    f.intent('MODIFY_PAGE');
    f.planner.generate.mockResolvedValue({
      status: 'NEEDS_CLARIFICATION',
      reason: 'MISSING_CHECKLIST_ITEMS',
      intent: { pageReference: null },
      pageTitle: 'sub man',
    });
    const message =
      'Checklist gồm những mục nào? Gửi lại cả câu kèm các mục, ví dụ: thêm checklist gồm in tài liệu, đặt phòng vào trang "sub man".';
    expect(
      await f.service.ask({ ...f.input, instruction: 'thêm checklist' }),
    ).toMatchObject({
      status: 'NEEDS_CLARIFICATION',
      assistantMessage: message,
    });
  });

  it('names the Page found in the sentence when none was extracted (gp02)', async () => {
    const f = fixture();
    f.intent('MODIFY_PAGE');
    f.planner.generate.mockResolvedValue({
      status: 'NEEDS_CLARIFICATION',
      reason: 'MISSING_CHECKLIST_ITEMS',
      intent: { pageReference: null },
      pageTitle: 'sub man',
    });
    const message =
      'Checklist gồm những mục nào? Gửi lại cả câu kèm các mục, ví dụ: thêm checklist gồm in tài liệu, đặt phòng vào trang "sub man".';
    expect(
      await f.service.ask({ ...f.input, instruction: 'thêm checklist' }),
    ).toMatchObject({
      status: 'NEEDS_CLARIFICATION',
      assistantMessage: message,
    });
  });
  it.each([
    'Thêm checklist',
    'Thêm checklist vào trang này',
    'Trang hiện tại thêm mục tổng kết',
    'Thêm checklist vào trang Q4',
    'Thêm heading "Delete Account"',
  ])(
    'delegates supported modification with Page context: %s',
    async (instruction) => {
      const f = fixture();
      f.intent('MODIFY_PAGE');
      await f.service.ask({
        ...f.input,
        instruction,
        currentPageId: 'page-1',
        selectedPageId: 'page-2',
        shareToken: 'share',
      });
      expect(f.planner.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          instruction,
          currentPageId: 'page-1',
          selectedPageId: 'page-2',
          shareToken: 'share',
        }),
      );
    },
  );
  it.each([
    'AMBIGUOUS_PAGE',
    'PAGE_NOT_FOUND',
    'NEEDS_CLARIFICATION',
    'PLAN_NEEDS_MORE_CONTEXT',
    'PLAN_GENERATED',
  ])('preserves planning business result %s', async (status) => {
    const f = fixture();
    f.intent('MODIFY_PAGE');
    f.planner.generate.mockResolvedValue({
      status,
      ...(status.startsWith('PLAN_')
        ? {
            plan: {
              generationId: 'g',
              conversationId: 'c',
              status: 'NEED_MORE_CONTEXT',
              operations: [],
            },
          }
        : {}),
    });
    expect(
      await f.service.ask({ ...f.input, instruction: 'Thêm checklist' }),
    ).toMatchObject({ status });
  });
  it.each([
    [
      { status: 'PAGE_NOT_FOUND', intent: { pageReference: 'Không tồn tại' } },
      'Không tìm thấy trang "Không tồn tại"',
    ],
    [
      {
        status: 'AMBIGUOUS_PAGE',
        intent: { pageReference: 'Test' },
        candidates: [],
      },
      'Có nhiều trang tên "Test"',
    ],
    [
      {
        status: 'NEEDS_CLARIFICATION',
        reason: 'MISSING_CURRENT_PAGE',
        intent: { pageReference: null },
      },
      'Bạn muốn sửa trang nào?',
    ],
  ])('explains page resolution result %o', async (planning, message) => {
    const f = fixture();
    f.intent('MODIFY_PAGE');
    f.planner.generate.mockResolvedValue(planning);
    const result = await f.service.ask({
      ...f.input,
      instruction: 'Thêm checklist',
    });
    expect(result.assistantMessage).toContain(message);
  });
  it('rejects denied workspace before calling AI', async () => {
    const f = fixture();
    f.access.assertWorkspaceRead.mockRejectedValue(new ForbiddenException());
    await expect(f.service.ask(f.input)).rejects.toThrow(ForbiddenException);
    expect(f.classify).not.toHaveBeenCalled();
  });
  it('rejects cross-workspace current Page before calling AI', async () => {
    const f = fixture();
    f.access.getReadablePage.mockResolvedValue({
      getWorkspaceId: () => 'other',
    });
    await expect(
      f.service.ask({ ...f.input, currentPageId: 'other-page' }),
    ).rejects.toThrow(NotFoundException);
    expect(f.classify).not.toHaveBeenCalled();
  });
  it.each(['missing', 'other-workspace', 'other-owner', 'archived'])(
    'rejects invalid conversation %s',
    async (kind) => {
      const f = fixture();
      const conversation = AiConversation.create({
        userId: kind === 'other-owner' ? 'other' : 'actor',
        workspaceId: kind === 'other-workspace' ? 'other' : 'workspace-1',
        scope: AiConversationScope.GLOBAL,
        pageId: null,
      });
      if (kind === 'archived') conversation.archive();
      f.repository.findByIdAndUserId.mockResolvedValue(
        kind === 'missing' ? null : conversation,
      );
      await expect(
        f.service.ask({ ...f.input, conversationId: 'c' }),
      ).rejects.toThrow();
      expect(f.assistant.submit).not.toHaveBeenCalled();
      expect(f.create.execute).not.toHaveBeenCalled();
    },
  );
  describe('multi-turn chat: a conversation that does not fit the request (hướng 1)', () => {
    const globalConversation = () =>
      AiConversation.create({
        id: 'global-conv',
        userId: 'actor',
        workspaceId: 'workspace-1',
        scope: AiConversationScope.GLOBAL,
        pageId: null,
      });
    const pageConversation = () =>
      AiConversation.create({
        id: 'page-conv',
        userId: 'actor',
        workspaceId: 'workspace-1',
        scope: AiConversationScope.PAGE,
        pageId: 'page-1',
      });
    const translate = (f: ReturnType<typeof fixture>) => {
      f.intent('WRITING', 'TRANSLATE', 'English');
      return 'Dịch sang tiếng Anh: Xin chào';
    };
    const plan = (conversationId: string) => ({
      status: 'PLAN_GENERATED',
      plan: {
        generationId: 'draft-generation',
        conversationId,
        pageId: 'page-2',
        status: 'PLAN_READY',
        operations: [],
      },
    });

    it.each(['CREATE_PAGE', 'WRITING'])(
      'keeps using a GLOBAL conversation for %s',
      async (kind) => {
        const f = fixture();
        f.repository.findByIdAndUserId.mockResolvedValue(globalConversation());
        const instruction =
          kind === 'WRITING' ? translate(f) : f.input.instruction;
        const result = await f.service.ask({
          ...f.input,
          instruction,
          conversationId: 'global-conv',
        });
        expect(result).toMatchObject({
          status: 'GENERATION_CREATED',
          conversationId: 'global-conv',
        });
        expect(result).not.toHaveProperty('conversationSwitched');
        expect(f.create.execute).not.toHaveBeenCalled();
        expect(f.assistant.submit).toHaveBeenCalledWith(
          expect.objectContaining({ conversationId: 'global-conv' }),
        );
      },
    );

    it.each(['CREATE_PAGE', 'WRITING'])(
      'opens a new GLOBAL conversation for %s sent from a PAGE conversation',
      async (kind) => {
        const f = fixture();
        f.repository.findByIdAndUserId.mockResolvedValue(pageConversation());
        const instruction =
          kind === 'WRITING' ? translate(f) : f.input.instruction;
        const result = await f.service.ask({
          ...f.input,
          instruction,
          conversationId: 'page-conv',
        });
        expect(result).toMatchObject({
          status: 'GENERATION_CREATED',
          conversationId: 'new-conversation',
          conversationSwitched: true,
        });
        expect(f.create.execute).toHaveBeenCalledWith(
          expect.objectContaining({ scope: AiConversationScope.GLOBAL }),
        );
        // Nothing is written to the PAGE conversation.
        expect(f.assistant.submit).toHaveBeenCalledWith(
          expect.objectContaining({ conversationId: 'new-conversation' }),
        );
      },
    );

    it('keeps a PAGE conversation for Writing about that same open Page', async () => {
      const f = fixture();
      f.repository.findByIdAndUserId.mockResolvedValue(pageConversation());
      const result = await f.service.ask({
        ...f.input,
        instruction: translate(f),
        conversationId: 'page-conv',
        currentPageId: 'page-1',
      });
      expect(result).toMatchObject({ conversationId: 'page-conv' });
      expect(result).not.toHaveProperty('conversationSwitched');
    });

    it('lets the planner open a PAGE conversation for an edit sent from a GLOBAL one', async () => {
      const f = fixture();
      f.intent('MODIFY_PAGE');
      f.repository.findByIdAndUserId.mockResolvedValue(globalConversation());
      f.planner.generate.mockResolvedValue(plan('new-page-conv'));
      const result = await f.service.ask({
        ...f.input,
        instruction: 'Thêm checklist vào trang "QA"',
        conversationId: 'global-conv',
      });
      expect(result).toMatchObject({
        status: 'PLAN_GENERATED',
        conversationId: 'new-page-conv',
        conversationSwitched: true,
      });
      const [planning] = f.planner.generate.mock.calls[0] as [
        Record<string, unknown>,
      ];
      expect(planning.conversationId).toBeUndefined();
      expect(planning.conversationPageId).toBeUndefined();
    });

    it.each([
      ['the same Page', 'page-conv', false],
      ['another Page', 'new-page-conv', true],
    ])(
      'passes the PAGE conversation and its Page to the planner (%s)',
      async (_label, returned, switched) => {
        const f = fixture();
        f.intent('MODIFY_PAGE');
        f.repository.findByIdAndUserId.mockResolvedValue(pageConversation());
        f.planner.generate.mockResolvedValue(plan(returned));
        const result = await f.service.ask({
          ...f.input,
          instruction: 'Thêm checklist vào trang "QA"',
          conversationId: 'page-conv',
        });
        expect(f.planner.generate).toHaveBeenCalledWith(
          expect.objectContaining({
            conversationId: 'page-conv',
            conversationPageId: 'page-1',
          }),
        );
        expect(result).toMatchObject({ conversationId: returned });
        if (switched)
          expect(result).toMatchObject({ conversationSwitched: true });
        else expect(result).not.toHaveProperty('conversationSwitched');
      },
    );

    it('does not open or switch a conversation for a non-draft answer', async () => {
      const f = fixture();
      f.intent('MODIFY_PAGE');
      f.repository.findByIdAndUserId.mockResolvedValue(globalConversation());
      f.planner.generate.mockResolvedValue({
        status: 'PAGE_NOT_FOUND',
        intent: { pageReference: 'QA' },
      });
      const result = await f.service.ask({
        ...f.input,
        instruction: 'Thêm checklist vào trang "QA"',
        conversationId: 'global-conv',
      });
      expect(result).toMatchObject({ status: 'PAGE_NOT_FOUND' });
      expect(result).not.toHaveProperty('conversationId');
      expect(result).not.toHaveProperty('conversationSwitched');
      expect(f.create.execute).not.toHaveBeenCalled();
    });

    describe('keeps the previous behavior with a share token (D4)', () => {
      it('rejects an edit sent from a GLOBAL conversation', async () => {
        const f = fixture();
        f.intent('MODIFY_PAGE');
        f.repository.findByIdAndUserId.mockResolvedValue(globalConversation());
        await expect(
          f.service.ask({
            ...f.input,
            instruction: 'Thêm checklist vào trang "QA"',
            conversationId: 'global-conv',
            shareToken: 'share',
          }),
        ).rejects.toThrow(BadRequestException);
        expect(f.planner.generate).not.toHaveBeenCalled();
      });

      it('rejects page creation sent from a PAGE conversation', async () => {
        const f = fixture();
        f.repository.findByIdAndUserId.mockResolvedValue(pageConversation());
        await expect(
          f.service.ask({
            ...f.input,
            conversationId: 'page-conv',
            shareToken: 'share',
          }),
        ).rejects.toThrow(BadRequestException);
        expect(f.create.execute).not.toHaveBeenCalled();
        expect(f.assistant.submit).not.toHaveBeenCalled();
      });

      it('keeps the planner strict about the conversation Page', async () => {
        const f = fixture();
        f.intent('MODIFY_PAGE');
        f.repository.findByIdAndUserId.mockResolvedValue(pageConversation());
        f.planner.generate.mockResolvedValue(plan('page-conv'));
        await f.service.ask({
          ...f.input,
          instruction: 'Thêm checklist vào trang "QA"',
          conversationId: 'page-conv',
          shareToken: 'share',
        });
        const [planning] = f.planner.generate.mock.calls[0] as [
          Record<string, unknown>,
        ];
        expect(planning.conversationId).toBe('page-conv');
        expect(planning.conversationPageId).toBeUndefined();
      });
    });
  });

  it('rejects combined UTF-8 input budget without truncation', async () => {
    const f = fixture();
    await expect(
      f.service.ask({
        ...f.input,
        instruction: 'x'.repeat(4000),
        selectedText: 'x'.repeat(6000),
      }),
    ).rejects.toThrow(BadRequestException);
    expect(f.classify).not.toHaveBeenCalled();
  });

  it('rejects composition context over 8000 bytes before creating conversation', async () => {
    const f = fixture();
    await expect(
      f.service.ask({ ...f.input, selectedText: 'x'.repeat(7990) }),
    ).rejects.toThrow(BadRequestException);
    expect(f.create.execute).not.toHaveBeenCalled();
    expect(f.assistant.submit).not.toHaveBeenCalled();
  });
});
