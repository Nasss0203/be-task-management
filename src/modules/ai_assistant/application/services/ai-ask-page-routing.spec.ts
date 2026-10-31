import { ForbiddenException } from '@nestjs/common';
import type { Page } from 'src/modules/content/domain/aggregates/page/page.aggregate';
import { AiAskService } from './ai-ask.service';
import { AiConversationAccessService } from './ai-conversation-access.service';
import { AiPageInstructionPlannerService } from './ai-page-instruction-planner.service';
import { PageIntentExtractionService } from '../resolution/page-intent-extraction.service';
import { PageReferenceResolver } from '../resolution/page-reference-resolver.service';
import { AiConversation } from '../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiConversationScope } from '../../domain/enums/ai-conversation-scope.enum';

describe('Ask -> Page Intent -> authorized resolver -> draft planner', () => {
  function fixture() {
    const page = (id: string, workspace = 'workspace-1') =>
      ({
        getId: () => id,
        getWorkspaceId: () => workspace,
        getTitle: () => 'Q4',
        getParentPageId: () => null,
        getTeamspaceId: () => null,
        getDeletedAt: () => null,
      }) as unknown as Page;
    const pages = new Map([
      ['q3', page('q3')],
      ['q4', page('q4')],
      ['q4b', page('q4b')],
      ['private', page('private')],
      ['cross', page('cross', 'other-workspace')],
    ]);
    const authorize = jest
      .fn()
      .mockImplementation(({ target }: { target: { id: string } }) =>
        Promise.resolve(target.id !== 'private'),
      );
    const access = new AiConversationAccessService(
      {
        findById: jest.fn((id: string) =>
          Promise.resolve(pages.get(id) ?? null),
        ),
      } as never,
      { authorize } as never,
    );
    const findAccessibleByExactTitle = jest
      .fn()
      .mockResolvedValue([pages.get('q4')]);
    // M1b sentence matching reads ids and titles of the same scoped list.
    const findAccessibleTitlesInWorkspace = jest.fn(
      async (): Promise<{ id: string; title: string }[]> =>
        ((await findAccessibleByExactTitle()) as (Page | undefined)[])
          .filter((page): page is Page => page !== undefined)
          .map((page) => ({ id: page.getId(), title: page.getTitle() })),
    );
    const resolver = new PageReferenceResolver(
      {
        findAccessibleByExactTitle,
        findAccessibleTitlesInWorkspace,
        // M2 reads are covered in page-activity-resolution.spec.
        findRecentlyEditedPages: jest.fn(),
        findProfileTimeZone: jest.fn(),
      },
      access,
    );
    const extract = jest.fn().mockResolvedValue({
      result: {
        intent: 'MODIFY_PAGE',
        referenceType: 'TITLE',
        pageReference: 'Q4',
        instruction: 'Thêm checklist',
        needsClarification: false,
      },
    });
    const generate = jest
      .fn()
      .mockImplementation(({ pageId }: { pageId: string }) =>
        Promise.resolve({
          pageId,
          status: 'PLAN_READY',
          summary: 'Draft',
          type: 'AI_MODIFICATION_PLAN',
          schemaVersion: 1,
          operations: [],
          generationId: 'g',
          conversationId: 'c',
        }),
      );
    const planner = new AiPageInstructionPlannerService(
      new PageIntentExtractionService({ extract }),
      resolver,
      { generate } as never,
    );
    const findConversation = jest.fn();
    const service = new AiAskService(
      {
        classify: jest.fn().mockResolvedValue({
          result: {
            intent: 'MODIFY_PAGE',
            writingAction: null,
            language: null,
            needsClarification: false,
          },
          provider: 'test',
          model: 'test',
        }),
      },
      access,
      { findByIdAndUserId: findConversation } as never,
      {} as never,
      {} as never,
      planner,
    );
    const input = {
      userId: 'actor',
      workspaceId: 'workspace-1',
      requestId: 'r',
      // A topic keeps this plannable; a bare checklist asks for its items (gp02).
      instruction: 'Thêm checklist QA vào trang Q4',
      currentPageId: 'q3',
    };
    return {
      service,
      input,
      findAccessibleByExactTitle,
      findConversation,
      pages,
      extract,
      generate,
      authorize,
    };
  }
  describe('multi-turn chat with the real planner (hướng 1)', () => {
    const conversation = (scope: AiConversationScope, pageId: string | null) =>
      AiConversation.create({
        id: `conv-${pageId ?? 'global'}`,
        userId: 'actor',
        workspaceId: 'workspace-1',
        scope,
        pageId,
      });
    const echoConversation = (f: ReturnType<typeof fixture>) =>
      f.generate.mockImplementation(
        ({
          pageId,
          conversationId,
        }: {
          pageId: string;
          conversationId?: string;
        }) =>
          Promise.resolve({
            pageId,
            status: 'PLAN_READY',
            summary: 'Draft',
            type: 'AI_MODIFICATION_PLAN',
            schemaVersion: 1,
            operations: [],
            generationId: 'g',
            conversationId: conversationId ?? 'new-page-conversation',
          }),
      );
    const dashboard = (f: ReturnType<typeof fixture>, conversationId: string) =>
      f.service.ask({ ...f.input, currentPageId: undefined, conversationId });

    it.each([
      [
        'a PAGE conversation of another Page (Q3)',
        AiConversationScope.PAGE,
        'q3',
      ],
      ['a GLOBAL conversation', AiConversationScope.GLOBAL, null],
    ])(
      'opens a PAGE conversation for Q4 instead of failing in %s',
      async (_label, scope, pageId) => {
        const f = fixture();
        const sent = conversation(scope, pageId);
        f.findConversation.mockResolvedValue(sent);
        echoConversation(f);
        expect(await dashboard(f, sent.getId())).toMatchObject({
          status: 'PLAN_GENERATED',
          conversationId: 'new-page-conversation',
          conversationSwitched: true,
          planning: { page: { pageId: 'q4' } },
        });
        // The sent conversation is never written to.
        expect(f.generate).toHaveBeenCalledTimes(1);
        expect(
          (f.generate.mock.calls[0] as [{ conversationId?: string }])[0]
            .conversationId,
        ).toBeUndefined();
      },
    );

    it('keeps the PAGE conversation of the same Page', async () => {
      const f = fixture();
      f.findConversation.mockResolvedValue(
        conversation(AiConversationScope.PAGE, 'q4'),
      );
      echoConversation(f);
      const result = await dashboard(f, 'conv-q4');
      expect(result).toMatchObject({
        status: 'PLAN_GENERATED',
        conversationId: 'conv-q4',
      });
      expect(result).not.toHaveProperty('conversationSwitched');
    });

    it('still refuses a PAGE conversation whose Page the user can no longer read', async () => {
      const f = fixture();
      f.findConversation.mockResolvedValue(
        conversation(AiConversationScope.PAGE, 'private'),
      );
      echoConversation(f);
      await expect(dashboard(f, 'conv-private')).rejects.toThrow(
        ForbiddenException,
      );
      expect(f.generate).not.toHaveBeenCalled();
    });
  });
  it('named Q4 wins over current Q3; exposes a preview without Apply', async () => {
    const f = fixture();
    expect(await f.service.ask(f.input)).toMatchObject({
      status: 'PLAN_GENERATED',
      generationId: 'g',
      conversationId: 'c',
      preview: { pageId: 'q4', counts: { operations: 0 } },
      planning: { page: { pageId: 'q4' } },
    });
    expect(f.extract).toHaveBeenCalledWith(f.input.instruction, 'q3');
    expect(f.generate).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: 'q4' }),
    );
  });
  it.each([
    'tích gửi email trong trang Q4',
    'đánh dấu đã hoàn thành phần gửi email ở trang Q4',
    'gửi email xong rồi, trong trang Q4',
    'bỏ tích gửi email trong trang Q4',
  ])(
    'drafts a to-do tick through the real admission (kế hoạch tích to-do): %s',
    async (instruction) => {
      const f = fixture();
      expect(await f.service.ask({ ...f.input, instruction })).toMatchObject({
        status: 'PLAN_GENERATED',
        planning: { page: { pageId: 'q4' } },
      });
      expect(f.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          pageId: 'q4',
          originalInstruction: instruction,
        }),
      );
    },
  );

  it.each([
    'đổi Gửi email thành Gửi thư trong trang Q4',
    'sửa tuần sau thành tháng sau ở trang Q4',
  ])(
    'drafts a block text edit through the real admission (kế hoạch sửa chữ block): %s',
    async (instruction) => {
      const f = fixture();
      expect(await f.service.ask({ ...f.input, instruction })).toMatchObject({
        status: 'PLAN_GENERATED',
        planning: { page: { pageId: 'q4' } },
      });
    },
  );

  it.each(['xoá to-do Gửi email trong trang Q4', 'bỏ dòng Ghi chú ở trang Q4'])(
    'drafts a block delete through the real admission (kế hoạch xoá block): %s',
    async (instruction) => {
      const f = fixture();
      expect(await f.service.ask({ ...f.input, instruction })).toMatchObject({
        status: 'PLAN_GENERATED',
        planning: { page: { pageId: 'q4' } },
      });
    },
  );

  it('refuses a bulk delete with its own message (kế hoạch xoá block)', async () => {
    const f = fixture();
    expect(
      await f.service.ask({
        ...f.input,
        instruction: 'xoá hết trong trang Q4',
      }),
    ).toMatchObject({
      status: 'UNSUPPORTED_OPERATION',
      assistantMessage:
        'AI chỉ xoá từng block được nêu tên (tối đa 10 block mỗi câu), không xoá hàng loạt.',
    });
    expect(f.generate).not.toHaveBeenCalled();
  });

  it('names the blocked word through the real planner (kế hoạch sửa nhỏ, D3)', async () => {
    const f = fixture();
    expect(
      await f.service.ask({
        ...f.input,
        instruction: 'tích xoá dữ liệu trong trang Q4',
      }),
    ).toMatchObject({
      status: 'UNSUPPORTED_OPERATION',
      assistantMessage:
        'Hiện tại AI chưa làm được "xoá". Nếu "xoá" là nội dung cần thêm hoặc chữ mới, hãy đặt nó trong ngoặc kép.',
    });
  });

  it.each([
    'đổi tên trang Q4 thành Q5',
    'đổi Gửi email thành xoá dữ liệu trong trang Q4',
  ])('refuses %s without drafting', async (instruction) => {
    const f = fixture();
    expect(await f.service.ask({ ...f.input, instruction })).toMatchObject({
      status: 'UNSUPPORTED_OPERATION',
    });
    expect(f.generate).not.toHaveBeenCalled();
  });

  it('refuses a tick mixed with an insertion without drafting (D4)', async () => {
    const f = fixture();
    expect(
      await f.service.ask({
        ...f.input,
        instruction: 'tích gửi email và thêm checklist gồm a vào trang Q4',
      }),
    ).toMatchObject({ status: 'UNSUPPORTED_OPERATION' });
    expect(f.generate).not.toHaveBeenCalled();
  });

  it.each(['Thêm checklist', 'Thêm checklist vào trang Q4'])(
    'asks for checklist items without generating a draft (gp02): %s',
    async (instruction) => {
      const f = fixture();
      expect(await f.service.ask({ ...f.input, instruction })).toMatchObject({
        status: 'NEEDS_CLARIFICATION',
        planning: { reason: 'MISSING_CHECKLIST_ITEMS' },
      });
      expect(f.generate).not.toHaveBeenCalled();
    },
  );

  it.each([
    'Thêm checklist QA',
    'Thêm checklist QA vào trang này',
    'Trang hiện tại thêm mục tổng kết',
  ])(
    'routes current Page through permission-aware resolver (%s)',
    async (instruction) => {
      const f = fixture();
      f.extract.mockResolvedValue({
        result: {
          intent: 'MODIFY_PAGE',
          referenceType: 'CURRENT_PAGE',
          pageReference: null,
          instruction: 'Thêm checklist',
          needsClarification: false,
        },
      });
      expect(await f.service.ask({ ...f.input, instruction })).toMatchObject({
        status: 'PLAN_GENERATED',
        planning: {
          resolutionMethod: 'CURRENT_CONTEXT',
          page: { pageId: 'q3' },
        },
      });
      expect(f.authorize).toHaveBeenCalledWith(
        expect.objectContaining({ target: { type: 'page', id: 'q3' } }),
      );
      expect(f.findAccessibleByExactTitle).not.toHaveBeenCalled();
    },
  );
  it('returns ambiguous candidates only after per-Page authorization', async () => {
    const f = fixture();
    f.findAccessibleByExactTitle.mockResolvedValue([...f.pages.values()]);
    const result = await f.service.ask(f.input);
    expect(result.status).toBe('AMBIGUOUS_PAGE');
    if ('planning' in result && result.planning.status === 'AMBIGUOUS_PAGE') {
      expect(result.planning.candidates.map((p) => p.pageId)).toEqual([
        'q3',
        'q4',
        'q4b',
      ]);
    }
    expect(f.generate).not.toHaveBeenCalled();
  });
  it.each([
    'Xóa heading trong trang Q4',
    'Sửa heading hiện có',
    'Đổi tên Page Q4 thành Q4 2026',
    'Dịch toàn bộ trang Q4',
    'Viết lại toàn bộ trang Q4',
    'Di chuyển block',
    'Làm phép lạ với trang Q4',
    'Thêm checklist rồi xóa heading',
    'Thêm checklist vào trang Q4 rồi xoá hết',
  ])(
    'blocks unsupported in the planner before resolution or drafting: %s',
    async (instruction) => {
      const f = fixture();
      expect(await f.service.ask({ ...f.input, instruction })).toMatchObject({
        status: 'UNSUPPORTED_OPERATION',
      });
      expect(f.findAccessibleByExactTitle).not.toHaveBeenCalled();
      expect(f.generate).not.toHaveBeenCalled();
    },
  );
  it('admits an unquoted real Page name only through the authorized sentence match', async () => {
    const f = fixture();
    f.extract.mockResolvedValue({
      result: {
        intent: 'MODIFY_PAGE',
        referenceType: 'UNRESOLVED',
        pageReference: null,
        instruction: 'add a QA checklist',
        needsClarification: true,
      },
    });
    const result = await f.service.ask({
      ...f.input,
      instruction: 'add a QA checklist to Q4 page',
    });
    // "… to Q4 page" names one real Page exactly: drafted without a choice.
    expect(result).toMatchObject({
      status: 'PLAN_GENERATED',
      planning: { resolutionMethod: 'EXACT_TITLE', page: { pageId: 'q4' } },
    });
    expect(f.generate).toHaveBeenCalledWith(
      expect.objectContaining({ pageId: 'q4' }),
    );
  });
  it.each(['private', 'cross', 'missing'])(
    'does not resolve inaccessible named Page (%s)',
    async (target) => {
      const f = fixture();
      f.findAccessibleByExactTitle.mockResolvedValue(
        f.pages.has(target) ? [f.pages.get(target)] : [],
      );
      expect(await f.service.ask(f.input)).toMatchObject({
        status: 'PAGE_NOT_FOUND',
      });
      expect(f.generate).not.toHaveBeenCalled();
    },
  );
  it('rejects unauthorized current Page before classification/resolution', async () => {
    const f = fixture();
    await expect(
      f.service.ask({ ...f.input, currentPageId: 'private' }),
    ).rejects.toThrow(ForbiddenException);
    expect(f.extract).not.toHaveBeenCalled();
    expect(f.generate).not.toHaveBeenCalled();
  });
  it.each(['q4b', 'private'])(
    'accepts selectedPageId only inside fresh authorized candidates (%s)',
    async (selectedPageId) => {
      const f = fixture();
      f.findAccessibleByExactTitle.mockResolvedValue([
        f.pages.get('q4'),
        f.pages.get('q4b'),
        f.pages.get('private'),
      ]);
      expect(await f.service.ask({ ...f.input, selectedPageId })).toMatchObject(
        {
          status:
            selectedPageId === 'q4b' ? 'PLAN_GENERATED' : 'PAGE_NOT_FOUND',
        },
      );
      if (selectedPageId === 'private')
        expect(f.generate).not.toHaveBeenCalled();
    },
  );
  it('rejects planner target mismatch through the complete Ask chain', async () => {
    const f = fixture();
    f.generate.mockResolvedValue({ pageId: 'other', status: 'PLAN_READY' });
    await expect(f.service.ask(f.input)).rejects.toThrow('target mismatch');
  });
});
