import { Inject, Injectable, PayloadTooLargeException } from '@nestjs/common';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import type { UnitOfWork } from 'src/shared/infrastructure/persistence/unit-of-work.interface';
import { AI_ASSISTANT_TYPES } from '../../ai-assistant.types';
import { AiConversation } from '../../domain/aggregates/ai-conversation/ai-conversation.aggregate';
import { AiMessage } from '../../domain/entities/ai-message.entity';
import { AiConversationScope } from '../../domain/enums/ai-conversation-scope.enum';
import { AiConversationStatus } from '../../domain/enums/ai-conversation-status.enum';
import { AiMessageRole } from '../../domain/enums/ai-message-role.enum';
import type { AiConversationRepository } from '../../domain/repositories/ai-conversation.repository';
import type { AiMessageRepository } from '../../domain/repositories/ai-message.repository';
import type { AiPageContextResponseDto } from '../dto/response/ai-page-context.response.dto';
import type { PageQuestionKind } from '../ports/ai-intent.port';
import type { AiPageQuestionPort } from '../ports/ai-page-question.port';
import { GetAiPageContextHandler } from '../queries/get-ai-page-context/get-ai-page-context.handler';
import { GetAiPageContextQuery } from '../queries/get-ai-page-context/get-ai-page-context.query';
import { PageReferenceResolver } from '../resolution/page-reference-resolver.service';
import type { PageResolutionCandidate } from '../resolution/page-resolution.types';
import { foldInstruction } from './ai-instruction-evidence';

export const PAGE_QUESTION_CAPABILITY = 'PAGE_QUESTION';

export interface AskPageQuestionInput {
  userId: string;
  workspaceId: string;
  requestId: string;
  instruction: string;
  questionKind: PageQuestionKind;
  pageReference: string | null;
  databaseReference: string | null;
  currentPageId?: string | null;
  selectedPageId?: string | null;
  conversation: AiConversation | null;
  shareToken?: string;
}

export type PageQuestionOutcome =
  | {
      status: 'ANSWERED';
      answer: string;
      page: PageResolutionCandidate;
      conversationId: string;
      conversationSwitched: boolean;
      usedModel: boolean;
    }
  | {
      status: 'AMBIGUOUS_PAGE';
      candidates: PageResolutionCandidate[];
      resolutionMethod?: 'TITLE_IN_SENTENCE' | 'FUZZY_TITLE';
    }
  | { status: 'PAGE_NOT_FOUND'; name: string | null }
  | { status: 'NEEDS_PAGE' }
  | { status: 'PAGE_TOO_LONG' };

type Found =
  | { page: PageResolutionCandidate; context?: AiPageContextResponseDto }
  | {
      candidates: PageResolutionCandidate[];
      resolutionMethod?: 'TITLE_IN_SENTENCE' | 'FUZZY_TITLE';
    }
  | null;

function sameName(a: string, b: string): boolean {
  const key = (value: string) =>
    foldInstruction(value).replace(/\s+/gu, ' ').trim();
  return key(a) === key(b);
}

function startsWithName(read: string, title: string): boolean {
  const key = (value: string) =>
    foldInstruction(value).replace(/\s+/gu, ' ').trim();
  const name = key(title);
  const typed = key(read);
  return (
    !!name &&
    !!typed &&
    (typed === name ||
      typed.startsWith(`${name} `) ||
      name.startsWith(`${typed} `))
  );
}

@Injectable()
export class AiPageQuestionService {
  constructor(
    private readonly pageReferenceResolver: PageReferenceResolver,
    private readonly getAiPageContextHandler: GetAiPageContextHandler,
    @Inject(AI_ASSISTANT_TYPES.ports.AiPageQuestion)
    private readonly runtime: AiPageQuestionPort,
    @Inject(AI_ASSISTANT_TYPES.repositories.AiConversationRepository)
    private readonly conversations: AiConversationRepository,
    @Inject(AI_ASSISTANT_TYPES.repositories.AiMessageRepository)
    private readonly messages: AiMessageRepository,
    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async answer(input: AskPageQuestionInput): Promise<PageQuestionOutcome> {
    let found: Found;
    try {
      found = await this.findPage(input);
    } catch (error) {
      if (error instanceof PayloadTooLargeException)
        return { status: 'PAGE_TOO_LONG' };
      throw error;
    }
    if (!found) {
      const name = input.pageReference ?? input.databaseReference;
      return name || input.currentPageId
        ? { status: 'PAGE_NOT_FOUND', name }
        : { status: 'NEEDS_PAGE' };
    }
    if ('candidates' in found) {
      const selected = input.selectedPageId
        ? found.candidates.find((page) => page.pageId === input.selectedPageId)
        : undefined;
      if (input.selectedPageId && !selected)
        return { status: 'PAGE_NOT_FOUND', name: null };
      if (!selected)
        return {
          status: 'AMBIGUOUS_PAGE',
          candidates: found.candidates,
          ...(found.resolutionMethod
            ? { resolutionMethod: found.resolutionMethod }
            : {}),
        };
      found = { page: selected };
    }
    if (input.selectedPageId && found.page.pageId !== input.selectedPageId)
      return { status: 'PAGE_NOT_FOUND', name: null };

    let context: AiPageContextResponseDto;
    let result: Awaited<ReturnType<AiPageQuestionPort['answerPageQuestion']>>;
    try {
      context = found.context ?? (await this.readContext(input, found.page));
      result = await this.runtime.answerPageQuestion({
        question: input.instruction,
        questionKind: input.questionKind,
        databaseReference: input.databaseReference,
        context: { ...context } as unknown as Record<string, unknown>,
      });
    } catch (error) {
      if (error instanceof PayloadTooLargeException)
        return { status: 'PAGE_TOO_LONG' };
      throw error;
    }
    const saved = await this.save(input, found.page, result.answer);
    return {
      status: 'ANSWERED',
      answer: result.answer,
      page: found.page,
      usedModel: result.usedModel,
      ...saved,
    };
  }

  private readContext(
    input: AskPageQuestionInput,
    page: PageResolutionCandidate,
  ): Promise<AiPageContextResponseDto> {
    return this.getAiPageContextHandler.execute(
      new GetAiPageContextQuery(input.userId, page.pageId, input.shareToken),
    );
  }

  private async byTitle(
    input: AskPageQuestionInput,
    title: string,
  ): Promise<Found> {
    const exact = await this.pageReferenceResolver.resolve({
      userId: input.userId,
      workspaceId: input.workspaceId,
      title,
      shareToken: input.shareToken,
    });
    if (exact.status === 'RESOLVED') return { page: exact.page };
    if (exact.status === 'AMBIGUOUS') return { candidates: exact.candidates };
    const inSentence = await this.fromSentence(input);
    if (
      inSentence &&
      'candidates' in inSentence &&
      inSentence.candidates.length === 1 &&
      startsWithName(title, inSentence.candidates[0].title)
    )
      return { page: inSentence.candidates[0] };
    if (inSentence) return inSentence;
    const similar = await this.pageReferenceResolver.resolveSimilarTitles({
      userId: input.userId,
      workspaceId: input.workspaceId,
      title,
      shareToken: input.shareToken,
    });
    return similar.status === 'CANDIDATES'
      ? { candidates: similar.candidates, resolutionMethod: 'FUZZY_TITLE' }
      : null;
  }

  private async fromSentence(input: AskPageQuestionInput): Promise<Found> {
    const found = await this.pageReferenceResolver.resolveFromSentence({
      userId: input.userId,
      workspaceId: input.workspaceId,
      instruction: input.instruction,
      shareToken: input.shareToken,
    });
    return found.status === 'CANDIDATES'
      ? { candidates: found.candidates, resolutionMethod: 'TITLE_IN_SENTENCE' }
      : null;
  }

  private async currentPage(input: AskPageQuestionInput): Promise<Found> {
    if (!input.currentPageId) return null;
    const current = await this.pageReferenceResolver.resolve({
      userId: input.userId,
      workspaceId: input.workspaceId,
      currentPageId: input.currentPageId,
      shareToken: input.shareToken,
    });
    return current.status === 'RESOLVED' ? { page: current.page } : null;
  }

  private async findPage(input: AskPageQuestionInput): Promise<Found> {
    if (input.pageReference) return this.byTitle(input, input.pageReference);
    if (input.databaseReference) {
      const current = await this.currentPage(input);
      if (current && 'page' in current) {
        const context = await this.readContext(input, current.page);
        if (
          context.databases.some((database) =>
            sameName(database.name, input.databaseReference!),
          )
        )
          return { page: current.page, context };
      }
      return (
        (await this.byTitle(input, input.databaseReference)) ??
        (current && 'page' in current ? current : null)
      );
    }
    return (await this.currentPage(input)) ?? this.fromSentence(input);
  }

  private save(
    input: AskPageQuestionInput,
    page: PageResolutionCandidate,
    answer: string,
  ): Promise<{ conversationId: string; conversationSwitched: boolean }> {
    return this.unitOfWork.runInTransaction(async (context) => {
      const sent = input.conversation;
      const reusable =
        sent &&
        sent.getScope() === AiConversationScope.PAGE &&
        sent.getPageId() === page.pageId &&
        sent.getStatus() === AiConversationStatus.ACTIVE
          ? sent
          : null;
      const conversation =
        reusable ??
        (await this.conversations.save(
          AiConversation.create({
            userId: input.userId,
            workspaceId: input.workspaceId,
            scope: AiConversationScope.PAGE,
            pageId: page.pageId,
            title: input.instruction.trim().slice(0, 255),
          }),
          context,
        ));
      const metadata = {
        capability: PAGE_QUESTION_CAPABILITY,
        requestId: input.requestId,
        questionKind: input.questionKind,
        pageId: page.pageId,
      };
      await this.messages.save(
        AiMessage.create({
          conversationId: conversation.getId(),
          role: AiMessageRole.USER,
          content: input.instruction,
          metadata,
        }),
        context,
      );
      await this.messages.save(
        AiMessage.create({
          conversationId: conversation.getId(),
          role: AiMessageRole.ASSISTANT,
          content: answer,
          metadata,
        }),
        context,
      );
      return {
        conversationId: conversation.getId(),
        conversationSwitched: !!sent && sent.getId() !== conversation.getId(),
      };
    });
  }
}
