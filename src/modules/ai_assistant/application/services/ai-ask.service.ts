import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnprocessableEntityException,
  Optional,
} from '@nestjs/common';
import { AI_ASSISTANT_TYPES } from '../../ai-assistant.types';
import { AiConversationScope } from '../../domain/enums/ai-conversation-scope.enum';
import { AiConversationStatus } from '../../domain/enums/ai-conversation-status.enum';
import type { AiConversationRepository } from '../../domain/repositories/ai-conversation.repository';
import { AiAskEventRecorder } from '../ask-log/ai-ask-event-recorder.service';
import { CreateConversationCommand } from '../commands/create-conversation/create-conversation.command';
import { CreateConversationHandler } from '../commands/create-conversation/create-conversation.handler';
import { PAGE_COMPOSITION_CAPABILITY } from '../constants/page-composition.constant';
import { AI_MODIFICATION_PLAN_CAPABILITY } from '../constants/ai-modification-plan.constant';
import type { AskAiRequestDto } from '../dto/request/ask-ai.request.dto';
import type { AiAskResponse } from '../dto/response/ai-ask.response';
import { AiModificationPlanPreviewResponseDto } from '../dto/response/ai-modification-plan-preview.response.dto';
import type {
  AiIntentPort,
  AiIntent,
  AiIntentRequest,
} from '../ports/ai-intent.port';
import type { AiGenerationResponseDto } from '../dto/response/ai-generation.response.dto';
import { AiAssistantService } from './ai-assistant.service';
import { AiConversationAccessService } from './ai-conversation-access.service';
import { AiPageInstructionPlannerService } from './ai-page-instruction-planner.service';
import { AiFollowUpService } from './ai-follow-up.service';
import {
  AiPageQuestionService,
  PAGE_QUESTION_CAPABILITY,
  type PageQuestionOutcome,
} from './ai-page-question.service';
import { resolveWritingSource } from './ai-writing-source';
import type { PageInstructionPlanningResult } from '../resolution/page-instruction-planning.types';
import type { UnsupportedModificationDetail } from './ai-modification-operation.policy';
import { foldInstruction } from './ai-instruction-evidence';

/** Chat nhiều lượt: the draft lives in another conversation than the one sent. */
function conversationSwitch(
  sent: string | null | undefined,
  used: string,
): { conversationSwitched?: true } {
  return sent && sent !== used ? { conversationSwitched: true } : {};
}

/** Kế hoạch câu tự nhiên (N4): an example in the order the AI reads, no quotes. */
function misplacedVerbMessage(term: string): string {
  const verb = foldInstruction(term);
  const example = /^(?:xoa|bo|go|delete|remove)$/u.test(verb)
    ? `${term} dòng Gọi khách ở trang Họp tuần`
    : /^(?:them|chen|bo sung|add|insert)/u.test(verb)
      ? `${term} to-do Gọi khách vào trang Họp tuần`
      : `${term} Báo cáo tháng 9 thành Báo cáo tháng 10 ở trang Họp tuần`;
  return `AI chưa hiểu cách sắp xếp câu này. Bạn thử viết việc cần làm trước, tên trang sau, ví dụ: "${example}".`;
}

/** UNCLEAR intent: what AI can do, with one example each (kế hoạch sửa lỗi người dùng giả lập). */
const UNCLEAR_MESSAGE =
  'Mình chưa hiểu bạn muốn làm gì. Bạn có thể thử: tạo trang ("Tạo trang Họp tuần gồm: chuẩn bị slide, gửi lịch"), sửa trang ("thêm to-do Gọi khách vào trang Họp tuần", "sửa A thành B ở trang Họp tuần", "tích xong Gọi khách ở trang Họp tuần"), hoặc dịch / viết lại một đoạn chữ.';

/** OTHER intent: not something AI does yet; what it does instead. */
const OTHER_MESSAGE =
  'AI chưa làm được yêu cầu này. Hiện AI làm được: tạo trang, thêm / sửa chữ / xoá / tích to-do trong trang, thêm dòng vào bảng, và dịch / viết lại / tóm tắt một đoạn chữ. Ví dụ: "thêm to-do Gọi khách vào trang Họp tuần".';

/** AI-Q1: what to tell the user when a question found no single Page. */
function pageQuestionMessage(
  outcome: Exclude<PageQuestionOutcome, { status: 'ANSWERED' }>,
): string {
  switch (outcome.status) {
    case 'AMBIGUOUS_PAGE':
      if (outcome.resolutionMethod === 'FUZZY_TITLE')
        return outcome.candidates.length === 1
          ? `Ý bạn là trang "${outcome.candidates[0].title}"? Chọn trang để AI trả lời:`
          : 'Có phải một trong các trang này? Chọn trang bạn muốn hỏi:';
      if (outcome.resolutionMethod === 'TITLE_IN_SENTENCE')
        return outcome.candidates.length === 1
          ? `Ý bạn là trang "${outcome.candidates[0].title}"? Chọn trang để AI trả lời:`
          : 'Bạn muốn hỏi trang nào? Chọn một trang:';
      return 'Có nhiều trang trùng tên. Chọn trang bạn muốn hỏi:';
    case 'PAGE_NOT_FOUND':
      return outcome.name
        ? `Không tìm thấy trang hoặc bảng "${outcome.name}" mà bạn có quyền xem. Kiểm tra lại tên.`
        : 'Không tìm thấy trang mà bạn có quyền xem. Kiểm tra lại tên trang.';
    case 'PAGE_TOO_LONG':
      return 'Trang này quá dài để AI đọc hết (hơn 200 block), nên AI chưa trả lời được câu hỏi về cả trang.';
    default:
      return 'Bạn muốn hỏi trang nào? Hãy ghi tên trang, ví dụ: trang Họp tuần còn việc nào chưa xong?';
  }
}

/** Kế hoạch sửa tính năng viết (V4): the AI service's code, mapped by the runtime adapter. */
const WRITING_NOT_DONE = 'WRITING_NOT_DONE';

/** Names what was refused, so the user knows how to rephrase (kế hoạch sửa nhỏ, D3). */
function unsupportedMessage(detail?: UnsupportedModificationDetail): string {
  switch (detail?.kind) {
    case 'BLOCKED_WORD':
      if (detail.misplaced) return misplacedVerbMessage(detail.term);
      return detail.pageAction
        ? `Hiện tại AI chưa làm được "${detail.term}": AI chỉ thay đổi nội dung bên trong trang.`
        : `Hiện tại AI chưa làm được "${detail.term}". Nếu "${detail.term}" là nội dung cần thêm hoặc chữ mới, hãy đặt nó trong ngoặc kép.`;

    case 'PUNCTUATION':
      return `Hãy viết yêu cầu thành một câu lệnh, không dùng dấu "${detail.term}".`;

    case 'MIXED':
      return 'Mỗi câu chỉ một loại việc: hãy gửi riêng từng yêu cầu.';

    case 'BULK':
      return 'AI chỉ xoá từng block được nêu tên (tối đa 10 block mỗi câu), không xoá hàng loạt.';

    default:
      return 'Hiện tại AI chỉ thêm block, thêm dòng database, tích / bỏ tích to-do, sửa chữ hoặc xoá block có chữ. Mỗi câu chỉ một loại việc, hãy gửi từng yêu cầu riêng.';
  }
}

/**
 * M7 (H5): "tìm trang có nói về X" / "trang nào có nhắc tới X" without an
 * edit only asks where something is; the reply says how to add the edit.
 */
function isFindOnlyRequest(instruction: string): boolean {
  const text = foldInstruction(instruction).replace(/\s+/gu, ' ').trim();
  return (
    /^(?:(?:hay|ban hay|giup toi|giup minh) )?(?:tim (?:(?:mot|1|cai) )?(?:trang|page)|(?:trang|page) nao) (?:nao )?(?:co noi ve|co nhac|co chua|chua|co ghi|noi ve)\b/u.test(
      text,
    ) || /^(?:please )?(?:find|which) (?:the )?page\b/u.test(text)
  );
}

/** M2: "bạn sửa hôm qua", "bạn sửa gần đây nhất có "release" trong tên". */
function activityLabel(
  intent: PageInstructionPlanningResult['intent'],
): string | null {
  if (intent?.referenceType !== 'ACTIVITY') return null;
  const { relative, days, titleHint } = intent.activity;
  const when = {
    LATEST: 'gần đây nhất',
    TODAY: 'hôm nay',
    YESTERDAY: 'hôm qua',
    N_DAYS_AGO: `${days} ngày trước`,
    LAST_WEEK: 'tuần trước',
    RECENT: 'gần đây',
  }[relative];
  return `bạn sửa ${when}${titleHint ? ` có "${titleHint}" trong tên` : ''}`;
}

/** Tells the user what went wrong finding the Page and how to phrase a retry. */
function pageResolutionMessage(
  planning: PageInstructionPlanningResult,
): string {
  const name = planning.intent?.pageReference?.trim();
  const activity = activityLabel(planning.intent);
  switch (planning.status) {
    case 'PAGE_NOT_FOUND':
      if (activity)
        return `Không thấy trang nào ${activity} mà bạn còn quyền truy cập. Hãy ghi tên trang, ví dụ: thêm checklist vào trang "Kế hoạch Q4".`;
      if (planning.intent?.referenceType === 'CONTENT')
        return `Không tìm thấy trang nào có nhắc tới "${planning.intent.topic}" mà bạn có quyền truy cập. Hãy ghi tên trang, ví dụ: thêm checklist vào trang "Kế hoạch Q4".`;
      if (planning.intent?.referenceType === 'DESCRIPTION')
        return `Không tìm thấy trang nào gần với mô tả "${planning.intent.description}" mà bạn có quyền truy cập. Hãy ghi tên trang, ví dụ: thêm checklist vào trang "Kế hoạch Q4".`;
      return name
        ? `Không tìm thấy trang "${name}" mà bạn có quyền truy cập trong workspace này. Kiểm tra lại tên trang.`
        : 'Không tìm thấy trang mà bạn có quyền truy cập trong workspace này. Kiểm tra lại tên trang.';
    case 'AMBIGUOUS_PAGE':
      // M2: always confirmed, even a single Page.
      if (planning.resolutionMethod === 'ACTIVITY' && activity) {
        return planning.candidates.length === 1
          ? `Trang ${activity} là "${planning.candidates[0].title}". Chọn trang để tiếp tục:`
          : `Các trang ${activity}. Chọn một trang:`;
      }
      // M4: no Page with the title is in the place the user named.
      if (
        planning.scopeUnmatched &&
        planning.intent.referenceType === 'TITLE'
      ) {
        const scope = planning.intent.scope;
        const place = scope?.parentTitle
          ? `"${scope.parentTitle}"`
          : `teamspace "${scope?.teamspaceName ?? ''}"`;
        return `Không có trang "${name}" nào trong ${place}. Chọn một trang:`;
      }
      // M7: Pages whose text holds the words, always picked by the user.
      if (
        planning.resolutionMethod === 'CONTENT' &&
        planning.intent.referenceType === 'CONTENT'
      ) {
        const topic = planning.intent.topic;
        return planning.candidates.length === 1
          ? `Trang có nhắc tới "${topic}" là "${planning.candidates[0].title}". Chọn trang để tiếp tục:`
          : `Các trang có nhắc tới "${topic}". Chọn một trang:`;
      }
      // M6: Pages close to a description, always picked by the user.
      if (planning.resolutionMethod === 'SEMANTIC') {
        const described =
          planning.intent.referenceType === 'DESCRIPTION'
            ? planning.intent.description
            : name;
        const typed =
          planning.intent.referenceType === 'DESCRIPTION'
            ? ''
            : 'Không có trang nào tên như vậy. ';
        return planning.candidates.length === 1
          ? `${typed}Trang gần với mô tả "${described}" là "${planning.candidates[0].title}". Chọn trang để tiếp tục:`
          : `${typed}Các trang gần với mô tả "${described}". Chọn một trang:`;
      }
      // M3: the typed name matched nothing; close titles need a choice.
      if (planning.resolutionMethod === 'FUZZY_TITLE') {
        const typed = name ? `Không có trang "${name}". ` : '';
        return planning.candidates.length === 1
          ? `${typed}Ý bạn là trang "${planning.candidates[0].title}"? Chọn trang để tiếp tục:`
          : `${typed}Có phải một trong các trang này? Chọn một trang:`;
      }
      if (planning.resolutionMethod === 'TITLE_IN_SENTENCE') {
        return planning.candidates.length === 1
          ? `Ý bạn là trang "${planning.candidates[0].title}"? Chọn trang để tiếp tục:`
          : 'Bạn muốn sửa trang nào? Chọn một trang:';
      }
      return name
        ? `Có nhiều trang tên "${name}". Chọn trang bạn muốn sửa:`
        : 'Có nhiều trang trùng tên. Chọn trang bạn muốn sửa:';
    case 'UNSUPPORTED_OPERATION':
      return unsupportedMessage(planning.detail);
    case 'NEEDS_CLARIFICATION':
      if (planning.reason === 'MISSING_SOURCE') {
        const intent = planning.intent;
        const source =
          intent?.intent === 'MODIFY_PAGE' ? (intent.basedOn ?? '') : '';
        return `Không tìm thấy nội dung nào về "${source}" mà bạn có quyền xem. Hãy ghi tên trang nguồn, ví dụ: … dựa trên trang "Bug tracker".`;
      }
      if (planning.reason === 'MISSING_CHECKLIST_ITEMS')
        return `Checklist gồm những mục nào? Gửi lại cả câu kèm các mục, ví dụ: thêm checklist gồm in tài liệu, đặt phòng vào trang "${planning.pageTitle || name || 'Kế hoạch Q4'}".`;
      return planning.reason === 'UNCLEAR_INTENT'
        ? 'Bạn muốn thay đổi gì trên trang? Hãy mô tả rõ nội dung cần thêm.'
        : 'Bạn muốn sửa trang nào? Ghi tên trang trong ngoặc kép, ví dụ: Thêm checklist vào trang "Kế hoạch Q4".';
    default:
      return 'Yêu cầu này không sửa một trang có sẵn. Hãy mô tả lại yêu cầu.';
  }
}

export type AskAiInput = Omit<AskAiRequestDto, 'requestId'> & {
  userId: string;
  requestId: string;
  shareToken?: string;
};

@Injectable()
export class AiAskService {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.ports.AiIntent)
    private readonly intentRuntime: AiIntentPort,
    @Inject(AI_ASSISTANT_TYPES.services.AiConversationAccess)
    private readonly access: AiConversationAccessService,
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversations: AiConversationRepository,
    private readonly createConversation: CreateConversationHandler,
    private readonly assistant: AiAssistantService,
    private readonly pagePlanner: AiPageInstructionPlannerService,
    private readonly askLog: AiAskEventRecorder,
    // Chat nhiều lượt — câu nhắc lượt trước; optional so older wiring still builds.
    @Optional() private readonly followUps?: AiFollowUpService,
    // AI-Q1 — hỏi đáp về trang; optional so older wiring still builds.
    @Optional() private readonly pageQuestions?: AiPageQuestionService,
  ) {}

  /** Kế hoạch ghi log Ask (L3): every Ask is recorded once, however it ends. */
  async ask(input: AskAiInput): Promise<AiAskResponse> {
    return this.askLog.trackAsk(
      {
        userId: input.userId,
        workspaceId: input.workspaceId,
        requestId: input.requestId,
        instruction: String(input.instruction ?? ''),
        currentPageId: input.currentPageId,
        selectedPageId: input.selectedPageId,
        selectedText: input.selectedText,
        shareToken: input.shareToken,
        findOnly:
          typeof input.instruction === 'string' &&
          isFindOnlyRequest(input.instruction),
      },
      () => this.answer(input),
    );
  }

  private async answer(input: AskAiInput): Promise<AiAskResponse> {
    let payload: AiIntentRequest = {
      instruction: input.instruction,
      ...(input.selectedText != null
        ? { selectedText: input.selectedText }
        : {}),
      ...(input.currentPageId != null
        ? { currentPageId: input.currentPageId }
        : {}),
    };
    if (
      typeof input.instruction !== 'string' ||
      !input.instruction.trim() ||
      input.instruction.length > 4000 ||
      (input.selectedText != null &&
        (typeof input.selectedText !== 'string' ||
          !input.selectedText.trim() ||
          input.selectedText.length > 8000)) ||
      Buffer.byteLength(JSON.stringify(payload), 'utf8') > 10000
    ) {
      throw new BadRequestException(
        'AI input exceeds text limits or the 10000-byte UTF-8 budget',
      );
    }
    await this.access.assertWorkspaceRead(input.userId, input.workspaceId);
    if (input.currentPageId) {
      const page = await this.access.getReadablePage(
        input.userId,
        input.currentPageId,
        input.shareToken,
      );
      if (page.getWorkspaceId() !== input.workspaceId)
        throw new NotFoundException('Page not found');
    }
    const conversation = input.conversationId
      ? await this.conversations.findByIdAndUserId(
          input.conversationId,
          input.userId,
        )
      : null;
    if (input.conversationId) {
      if (
        !conversation ||
        conversation.getUserId() !== input.userId ||
        conversation.getWorkspaceId() !== input.workspaceId ||
        conversation.getScope() === AiConversationScope.LEGACY
      ) {
        throw new NotFoundException('AI conversation not found');
      }
      await this.access.assertCanRead(
        conversation,
        input.userId,
        input.shareToken,
      );
      if (conversation.getStatus() !== AiConversationStatus.ACTIVE)
        throw new BadRequestException('AI conversation is archived');
    }

    // Kế hoạch chat nhiều lượt — hiểu câu nhắc lại lượt trước: "xoá nó đi" in a
    // PAGE conversation becomes an explicit sentence on that Page, checked as
    // any typed sentence; unsure → asked back.
    const followUp = await this.followUps?.resolve(
      input.instruction,
      conversation,
    );
    if (followUp?.kind === 'ASK' || followUp?.kind === 'DISCARD') {
      if (followUp.kind === 'DISCARD')
        await this.followUps?.discard(
          input.userId,
          followUp.generationId,
          input.shareToken,
        );
      return {
        requestId: input.requestId,
        intent: 'MODIFY_PAGE',
        status: 'NEEDS_CLARIFICATION',
        reason:
          followUp.kind === 'DISCARD' ? 'DRAFT_DISCARDED' : 'FOLLOW_UP_UNCLEAR',
        assistantMessage: followUp.message,
        capability: null,
      };
    }
    if (followUp?.kind === 'SENTENCE' && conversation?.getPageId()) {
      // DM1: the pending draft is replaced, not left open beside the new one.
      if (followUp.replaces)
        await this.followUps?.discard(
          input.userId,
          followUp.replaces,
          input.shareToken,
        );
      input = {
        ...input,
        instruction: followUp.instruction,
        currentPageId: conversation.getPageId(),
      };
      payload = {
        ...payload,
        instruction: followUp.instruction,
        currentPageId: conversation.getPageId(),
      };
    }

    const { result } = await this.intentRuntime.classify(payload);
    const business = (
      status:
        | 'NEEDS_CLARIFICATION'
        | 'UNSUPPORTED_REQUEST'
        | 'UNSUPPORTED_OPERATION',
      reason: string,
      assistantMessage: string,
    ): AiAskResponse => ({
      requestId: input.requestId,
      intent: result.intent,
      status,
      reason,
      assistantMessage,
      capability: null,
    });
    if (result.intent === 'PAGE_QUESTION' && result.questionKind) {
      if (!this.pageQuestions)
        return business(
          'UNSUPPORTED_REQUEST',
          'M0_CAPABILITY_UNAVAILABLE',
          OTHER_MESSAGE,
        );
      // A share-token request keeps the strict scope check (chat nhiều lượt, D4).
      if (
        conversation &&
        input.shareToken &&
        conversation.getScope() !== AiConversationScope.PAGE
      )
        throw new BadRequestException(
          'Page question requires a PAGE conversation',
        );
      let outcome: PageQuestionOutcome;
      try {
        outcome = await this.pageQuestions.answer({
          userId: input.userId,
          workspaceId: input.workspaceId,
          requestId: input.requestId,
          instruction: input.instruction,
          questionKind: result.questionKind,
          pageReference: result.pageReference ?? null,
          databaseReference: result.databaseReference ?? null,
          currentPageId: input.currentPageId,
          selectedPageId: input.selectedPageId,
          conversation,
          shareToken: input.shareToken,
        });
      } catch (error) {
        if (
          error instanceof UnprocessableEntityException &&
          error.message === WRITING_NOT_DONE
        )
          return business(
            'NEEDS_CLARIFICATION',
            WRITING_NOT_DONE,
            'AI chưa trả lời chắc chắn được câu này từ nội dung trang. Hãy hỏi cụ thể hơn, ví dụ: trang Họp tuần còn việc nào chưa xong?',
          );
        throw error;
      }
      if (outcome.status === 'ANSWERED')
        return {
          requestId: input.requestId,
          intent: 'PAGE_QUESTION',
          status: 'ANSWERED',
          capability: PAGE_QUESTION_CAPABILITY,
          reason: result.questionKind,
          conversationId: outcome.conversationId,
          ...(outcome.conversationSwitched
            ? { conversationSwitched: true as const }
            : {}),
          page: { pageId: outcome.page.pageId, title: outcome.page.title },
          usedModel: outcome.usedModel,
          assistantMessage: outcome.answer,
        };
      if (outcome.status === 'AMBIGUOUS_PAGE')
        return {
          requestId: input.requestId,
          intent: 'PAGE_QUESTION',
          status: 'AMBIGUOUS_PAGE',
          capability: PAGE_QUESTION_CAPABILITY,
          candidates: outcome.candidates,
          ...(outcome.resolutionMethod
            ? { resolutionMethod: outcome.resolutionMethod }
            : {}),
          assistantMessage: pageQuestionMessage(outcome),
        };
      return business(
        'NEEDS_CLARIFICATION',
        outcome.status === 'NEEDS_PAGE' ? 'UNRESOLVED_PAGE' : outcome.status,
        pageQuestionMessage(outcome),
      );
    }
    // M1b: an edit with an unclear Page name still goes to the planner, which
    // looks for real Page names in the sentence and asks if it finds none.
    if (
      result.intent === 'UNCLEAR' ||
      (result.needsClarification && result.intent !== 'MODIFY_PAGE')
    )
      return business('NEEDS_CLARIFICATION', 'UNCLEAR_INTENT', UNCLEAR_MESSAGE);
    if (result.intent === 'OTHER')
      return business(
        'UNSUPPORTED_REQUEST',
        'M0_CAPABILITY_UNAVAILABLE',
        isFindOnlyRequest(input.instruction)
          ? 'AI chưa trả lời câu chỉ tìm trang. Hãy ghi thêm việc cần làm, ví dụ: tìm trang có nói về OAuth rồi thêm checklist gồm test, review.'
          : OTHER_MESSAGE,
      );
    if (result.intent === 'MODIFY_PAGE') {
      // Admission is checked by the planner: only it knows which words are
      // the Page name (M1b, hướng A). It always checks before any draft.
      const pageConversation =
        conversation?.getScope() === AiConversationScope.PAGE
          ? conversation
          : null;
      // A share-token request keeps the strict scope check (chat nhiều lượt, D4).
      if (conversation && !pageConversation && input.shareToken)
        throw new BadRequestException(
          'Page modification requires a PAGE conversation',
        );
      let planning: PageInstructionPlanningResult;
      try {
        planning = await this.pagePlanner.generate({
          ...input,
          currentPageId: input.currentPageId ?? undefined,
          selectedPageId: input.selectedPageId ?? undefined,
          // A GLOBAL conversation never holds Page drafts: the planner opens a
          // PAGE conversation, also when the PAGE conversation is for another Page.
          conversationId: pageConversation?.getId(),
          conversationPageId: input.shareToken
            ? undefined
            : (pageConversation?.getPageId() ?? undefined),
        });
      } catch (error) {
        // Kế hoạch trang dài (E1): over 200 blocks here, or over the AI
        // service's budget, the user is told how to narrow the request.
        if (error instanceof PayloadTooLargeException)
          return business(
            'NEEDS_CLARIFICATION',
            'PAGE_TOO_LONG',
            'Trang này quá dài để AI đọc hết. Hãy nói rõ phần cần sửa, ví dụ: thêm to-do … vào phần "Tên mục".',
          );
        throw error;
      }
      const base = {
        requestId: input.requestId,
        intent: result.intent,
        capability: AI_MODIFICATION_PLAN_CAPABILITY,
      };
      if (
        planning.status === 'PLAN_GENERATED' ||
        planning.status === 'PLAN_NEEDS_MORE_CONTEXT'
      ) {
        return {
          ...base,
          status: planning.status,
          planning,
          generationId: planning.plan.generationId,
          conversationId: planning.plan.conversationId,
          ...conversationSwitch(
            input.conversationId,
            planning.plan.conversationId,
          ),
          preview: AiModificationPlanPreviewResponseDto.fromPlan(planning.plan),
          assistantMessage: planning.plan.summary,
        } as AiAskResponse;
      }
      return {
        ...base,
        status: planning.status,
        planning,
        assistantMessage: pageResolutionMessage(planning),
      } as AiAskResponse;
    }

    let capability: string = PAGE_COMPOSITION_CAPABILITY;
    let generationInput: Record<string, unknown> = {
      instruction: input.instruction,
      requestId: input.requestId,
    };
    if (result.intent === 'WRITING') {
      const source = resolveWritingSource(
        input.instruction,
        input.selectedText,
        result,
      );
      if (!source || !result.writingAction)
        return business(
          'NEEDS_CLARIFICATION',
          'MISSING_WRITING_SOURCE_OR_LANGUAGE',
          'Bạn vui lòng cung cấp đoạn văn và ngôn ngữ đích nếu cần dịch.',
        );
      capability = `writing.${result.writingAction.toLowerCase()}`;
      generationInput = { ...source, requestId: input.requestId };
    }
    const fitsConversation =
      !conversation ||
      (result.intent === 'CREATE_PAGE'
        ? conversation.getScope() === AiConversationScope.GLOBAL
        : conversation.getScope() !== AiConversationScope.PAGE ||
          conversation.getPageId() === input.currentPageId);
    // Chat nhiều lượt: a conversation of another kind is left untouched and a
    // new GLOBAL one is opened below. A share-token request stays strict (D4).
    if (!fitsConversation && input.shareToken) {
      throw new BadRequestException(
        'AI conversation scope does not match this request',
      );
    }
    const context =
      result.intent === 'CREATE_PAGE' && input.selectedText
        ? { selectedText: input.selectedText }
        : undefined;
    const capabilityPayload =
      result.intent === 'CREATE_PAGE'
        ? { instruction: input.instruction, ...(context ? { context } : {}) }
        : {
            action: result.writingAction,
            text: generationInput.text,
            language: generationInput.language ?? null,
          };
    if (
      (context && Buffer.byteLength(JSON.stringify(context), 'utf8') > 8000) ||
      Buffer.byteLength(JSON.stringify(capabilityPayload), 'utf8') > 10000
    ) {
      throw new BadRequestException(
        'AI capability input exceeds the UTF-8 budget',
      );
    }
    const conversationId =
      (fitsConversation ? conversation?.getId() : undefined) ??
      (
        await this.createConversation.execute(
          new CreateConversationCommand(
            input.userId,
            input.workspaceId,
            input.instruction.slice(0, 255),
            AiConversationScope.GLOBAL,
          ),
        )
      ).id;
    let generation: AiGenerationResponseDto;
    try {
      generation = await this.assistant.submit({
        userId: input.userId,
        requestId: input.requestId,
        conversationId,
        capability,
        content: input.instruction,
        input: generationInput,
        ...(context ? { context } : {}),
        metadata: { intent: result.intent satisfies AiIntent },
        shareToken: input.shareToken,
      });
    } catch (error) {
      // Kế hoạch sửa tính năng viết (V4): a result that failed the checks twice.
      if (
        error instanceof UnprocessableEntityException &&
        error.message === WRITING_NOT_DONE
      )
        return business(
          'NEEDS_CLARIFICATION',
          WRITING_NOT_DONE,
          'AI chưa làm tốt yêu cầu này với đoạn chữ của bạn. Hãy thử lại, hoặc bôi đen đoạn ngắn hơn và ghi rõ việc cần làm.',
        );
      throw error;
    }
    return {
      requestId: input.requestId,
      intent: result.intent,
      status: 'GENERATION_CREATED',
      capability,
      conversationId,
      ...conversationSwitch(input.conversationId, conversationId),
      generationId: generation.id,
      generation,
      assistantMessage:
        typeof generation.output_data === 'object' &&
        generation.output_data !== null &&
        'text' in generation.output_data &&
        typeof generation.output_data.text === 'string'
          ? generation.output_data.text
          : 'Bản nháp đã sẵn sàng để xem trước.',
    };
  }
}
