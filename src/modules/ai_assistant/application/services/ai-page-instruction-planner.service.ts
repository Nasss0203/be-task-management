import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';

import {
  DESCRIBED_PAGE_SEARCH_LIMIT,
  describedPageMatches,
} from '../embedding/described-page-candidates';
import {
  PageEmbeddingSearch,
  type PageEmbeddingMatch,
} from '../embedding/page-embedding-search.service';
import { PageIntentExtractionService } from '../resolution/page-intent-extraction.service';
import { PageReferenceResolver } from '../resolution/page-reference-resolver.service';
import { endsWithExactPageTitle } from '../resolution/page-title-sentence-matcher';
import type { PageScope } from '../resolution/page-intent.types';
import type { PageResolutionCandidate } from '../resolution/page-resolution.types';
import type {
  PageInstructionPlanningResult,
  PlanningResolutionMethod,
} from '../resolution/page-instruction-planning.types';
import { AiModificationPlannerService } from './ai-modification-planner.service';
import {
  explainUnsupportedModification,
  isBareChecklistRequest,
  isSupportedActivityModification,
  isSupportedDescriptionModification,
  withoutPageScope,
  isSupportedModification,
} from './ai-modification-operation.policy';

type ModifyPageIntent = Extract<
  Awaited<ReturnType<PageIntentExtractionService['extract']>>['result'],
  { intent: 'MODIFY_PAGE' }
>;

/** gp02: ask for the items rather than let the planner invent or copy them. */
function missingChecklistItems(
  intent: ModifyPageIntent,
  titles: readonly string[],
): PageInstructionPlanningResult {
  // The example in the reply names the Page only when it is a single real title.
  const [pageTitle, ...others] = [...new Set(titles)];
  return {
    status: 'NEEDS_CLARIFICATION',
    reason: 'MISSING_CHECKLIST_ITEMS',
    intent,
    ...(pageTitle && !others.length ? { pageTitle } : {}),
  };
}

export interface PlanPageInstructionInput {
  userId: string;
  workspaceId: string;
  instruction: string;
  requestId: string;
  currentPageId?: string;
  selectedPageId?: string;
  conversationId?: string;
  /**
   * Page of the PAGE conversation sent with an Ask (chat nhiều lượt). A draft
   * for another Page then opens a new PAGE conversation instead of failing.
   * Callers that omit it keep the strict same-Page requirement.
   */
  conversationPageId?: string;
  shareToken?: string;
  /** M2: the browser's zone from the Ask request (§11 #7). */
  timeZone?: string | null;
}

/**
 * Phase 3 orchestration only. NestJS is the target and permission authority.
 * FastAPI extracts the intent and (after an authorized target is resolved)
 * generates a draft through the existing planner; no mutation is executed.
 */
@Injectable()
export class AiPageInstructionPlannerService {
  private readonly logger = new Logger(AiPageInstructionPlannerService.name);

  constructor(
    private readonly extractionService: PageIntentExtractionService,
    private readonly pageReferenceResolver: PageReferenceResolver,
    private readonly modificationPlanner: AiModificationPlannerService,
    // M6: without it, no Page is looked for by description.
    @Optional() private readonly pageSearch?: PageEmbeddingSearch,
  ) {}

  async generate(
    input: PlanPageInstructionInput,
  ): Promise<PageInstructionPlanningResult> {
    if (
      !input.userId?.trim() ||
      !input.workspaceId?.trim() ||
      !input.requestId?.trim() ||
      typeof input.instruction !== 'string' ||
      !input.instruction.trim() ||
      input.instruction.length > 4000
    ) {
      throw new BadRequestException('Invalid AI page instruction request');
    }

    const extracted =
      input.currentPageId === undefined
        ? await this.extractionService.extract(input.instruction)
        : await this.extractionService.extract(
            input.instruction,
            input.currentPageId,
          );
    const intent = extracted.result;
    if (intent.intent === 'OTHER') {
      return { status: 'NOT_A_PAGE_MODIFICATION', intent };
    }
    if (intent.intent === 'UNCLEAR') {
      return {
        status: 'NEEDS_CLARIFICATION',
        reason: 'UNCLEAR_INTENT',
        intent,
      };
    }

    if (typeof intent.instruction !== 'string' || !intent.instruction.trim()) {
      throw new BadGatewayException('AI page instruction is invalid');
    }
    if (intent.referenceType === 'ACTIVITY') {
      return this.planFromActivity(input, intent);
    }
    if (intent.referenceType === 'DESCRIPTION') {
      return this.planFromDescription(input, intent);
    }

    const unresolved =
      intent.needsClarification || intent.referenceType === 'UNRESOLVED';
    // The name the AI service took from this source is data (M1b, hướng A).
    // Without any name yet, the original is checked once real names are known.
    const extractedNames =
      intent.referenceType === 'TITLE' && intent.pageReference
        ? [intent.pageReference]
        : [];
    // M4 (E4): the place ("… trong trang Dự án A") names, it never edits.
    const scope = intent.referenceType === 'TITLE' ? intent.scope : undefined;
    const admitted = scope
      ? withoutPageScope(input.instruction, scope)
      : input.instruction;
    if (
      !isSupportedModification(intent.instruction) ||
      admitted === null ||
      (!unresolved && !isSupportedModification(admitted, extractedNames))
    ) {
      return {
        status: 'UNSUPPORTED_OPERATION',
        intent,
        reason: 'INSERT_ONLY',
        detail: explainUnsupportedModification(
          admitted ?? input.instruction,
          extractedNames,
        ),
      };
    }

    if (unresolved) {
      return this.planFromSentence(input, intent, {
        status: 'NEEDS_CLARIFICATION',
        reason: 'UNRESOLVED_PAGE',
        intent,
      });
    }

    if (intent.referenceType === 'CURRENT_PAGE' && !input.currentPageId) {
      return {
        status: 'NEEDS_CLARIFICATION',
        reason: 'MISSING_CURRENT_PAGE',
        intent,
      };
    }

    if (input.selectedPageId && intent.referenceType !== 'TITLE') {
      throw new BadRequestException(
        'Selected Page requires an explicit Page title',
      );
    }

    const resolution =
      intent.referenceType === 'TITLE'
        ? await this.pageReferenceResolver.resolve({
            userId: input.userId,
            workspaceId: input.workspaceId,
            title: intent.pageReference ?? undefined,
            shareToken: input.shareToken,
          })
        : await this.pageReferenceResolver.resolve({
            userId: input.userId,
            workspaceId: input.workspaceId,
            currentPageId: input.currentPageId,
            shareToken: input.shareToken,
          });

    if (scope && resolution.status !== 'NOT_FOUND') {
      return this.planInScope(
        input,
        intent,
        scope,
        resolution.status === 'RESOLVED'
          ? [resolution.page]
          : resolution.candidates,
      );
    }
    if (resolution.status === 'NOT_FOUND') {
      // The extracted name may be unaccented or carry extra words.
      return intent.referenceType === 'TITLE'
        ? this.planFromSentence(input, intent, {
            status: 'PAGE_NOT_FOUND',
            intent,
          })
        : { status: 'PAGE_NOT_FOUND', intent };
    }
    if (resolution.status === 'AMBIGUOUS') {
      if (input.selectedPageId) {
        const selected = resolution.candidates.find(
          (candidate) => candidate.pageId === input.selectedPageId,
        );
        if (!selected) return { status: 'PAGE_NOT_FOUND', intent };
        return this.createPlan(input, intent, selected, 'EXACT_TITLE');
      }
      const titles = resolution.candidates.map((candidate) => candidate.title);
      if (isBareChecklistRequest(input.instruction, titles)) {
        return missingChecklistItems(intent, titles);
      }
      return {
        status: 'AMBIGUOUS_PAGE',
        intent,
        candidates: resolution.candidates,
      };
    }

    if (
      input.selectedPageId &&
      resolution.page.pageId !== input.selectedPageId
    ) {
      return { status: 'PAGE_NOT_FOUND', intent };
    }

    return this.createPlan(
      input,
      intent,
      resolution.page,
      resolution.resolutionMethod,
    );
  }

  /**
   * M1b: look for real Page names in the user's own words. A match is offered
   * for selection, unless the sentence ends with exactly one real title.
   */
  private async planFromSentence(
    input: PlanPageInstructionInput,
    intent: ModifyPageIntent,
    noMatch: PageInstructionPlanningResult,
  ): Promise<PageInstructionPlanningResult> {
    const found = await this.pageReferenceResolver.resolveFromSentence({
      userId: input.userId,
      workspaceId: input.workspaceId,
      instruction: input.instruction,
      shareToken: input.shareToken,
    });
    if (found.status === 'NOT_FOUND') {
      return this.planFromSimilarTitles(input, intent, noMatch);
    }
    if (found.status === 'TOO_MANY') {
      return {
        status: 'NEEDS_CLARIFICATION',
        reason: 'UNRESOLVED_PAGE',
        intent,
      };
    }
    // Deciding admission check: only names of real, readable Pages are data.
    // Runs before any candidate is shown and before any draft is generated.
    // M4: without the place, which was already admitted as a name.
    const titles = found.candidates.map((candidate) => candidate.title);
    const scope = intent.referenceType === 'TITLE' ? intent.scope : undefined;
    const source = scope
      ? (withoutPageScope(input.instruction, scope) ?? input.instruction)
      : input.instruction;
    const names =
      scope && intent.pageReference
        ? [...titles, intent.pageReference]
        : titles;
    if (!isSupportedModification(source, names)) {
      return {
        status: 'UNSUPPORTED_OPERATION',
        intent,
        reason: 'INSERT_ONLY',
        detail: explainUnsupportedModification(source, names),
      };
    }
    if (isBareChecklistRequest(input.instruction, titles)) {
      return missingChecklistItems(intent, titles);
    }
    const candidates = await this.narrowToScope(intent, found.candidates);
    if (input.selectedPageId) {
      const selected = candidates.find(
        (candidate) => candidate.pageId === input.selectedPageId,
      );
      if (!selected) return { status: 'PAGE_NOT_FOUND', intent };
      return this.createPlan(input, intent, selected, found.resolutionMethod);
    }
    // "… trong trang sub man" names one real Page exactly: nothing to choose.
    // The title now comes from the user's words, so the intent is resolved.
    // With a place (M4) the sentence ends with the place, not the target.
    const [only] = candidates;
    if (
      candidates.length === 1 &&
      !(intent.referenceType === 'TITLE' && intent.scope) &&
      endsWithExactPageTitle(input.instruction, only.title)
    ) {
      const resolved: ModifyPageIntent = {
        ...intent,
        referenceType: 'TITLE',
        pageReference: only.title,
        needsClarification: false,
      };
      return this.createPlan(input, resolved, only, 'EXACT_TITLE');
    }
    return {
      status: 'AMBIGUOUS_PAGE',
      intent,
      candidates,
      resolutionMethod: found.resolutionMethod,
    };
  }

  /**
   * M3: the typed name matched no real title, not even in the sentence.
   * Close titles are offered for a choice, never planned before it.
   */
  private async planFromSimilarTitles(
    input: PlanPageInstructionInput,
    intent: ModifyPageIntent,
    noMatch: PageInstructionPlanningResult,
  ): Promise<PageInstructionPlanningResult> {
    if (intent.referenceType !== 'TITLE' || !intent.pageReference) {
      return noMatch;
    }
    const similar = await this.pageReferenceResolver.resolveSimilarTitles({
      userId: input.userId,
      workspaceId: input.workspaceId,
      title: intent.pageReference,
      shareToken: input.shareToken,
    });
    if (similar.status === 'NOT_FOUND') {
      // M6 (G4): the model may take a whole description for a name.
      return this.planFromDescribedPages(
        input,
        intent,
        intent.pageReference,
        noMatch,
      );
    }
    // The typed name was already admitted as data (M1b, hướng A).
    if (isBareChecklistRequest(input.instruction, [intent.pageReference])) {
      return missingChecklistItems(intent, []);
    }
    const candidates = await this.narrowToScope(intent, similar.candidates);
    if (input.selectedPageId) {
      const selected = candidates.find(
        (candidate) => candidate.pageId === input.selectedPageId,
      );
      if (!selected) return { status: 'PAGE_NOT_FOUND', intent };
      return this.createPlan(input, intent, selected, 'FUZZY_TITLE');
    }
    return {
      status: 'AMBIGUOUS_PAGE',
      intent,
      candidates,
      resolutionMethod: 'FUZZY_TITLE',
    };
  }

  /**
   * M4 (E3): Pages with the exact title, narrowed to the place the user
   * named. One left: no choice is needed. Otherwise the user picks, and if
   * the place matched none, every Page with the title is offered.
   */
  private async planInScope(
    input: PlanPageInstructionInput,
    intent: ModifyPageIntent,
    scope: PageScope,
    candidates: PageResolutionCandidate[],
  ): Promise<PageInstructionPlanningResult> {
    const inScope = await this.pageReferenceResolver.filterByScope(
      candidates,
      scope,
    );
    const offered = inScope.length > 0 ? inScope : candidates;
    if (input.selectedPageId) {
      const selected = offered.find(
        (candidate) => candidate.pageId === input.selectedPageId,
      );
      if (!selected) return { status: 'PAGE_NOT_FOUND', intent };
      return this.createPlan(input, intent, selected, 'EXACT_TITLE');
    }
    const titles = offered.map((candidate) => candidate.title);
    const withoutPlace =
      withoutPageScope(input.instruction, scope) ?? input.instruction;
    if (isBareChecklistRequest(withoutPlace, titles)) {
      return missingChecklistItems(intent, titles);
    }
    if (inScope.length === 1) {
      return this.createPlan(input, intent, inScope[0], 'EXACT_TITLE');
    }
    return {
      status: 'AMBIGUOUS_PAGE',
      intent,
      candidates: offered,
      ...(inScope.length === 0 ? { scopeUnmatched: true as const } : {}),
    };
  }

  /** M4: sentence or close-title candidates in the named place, if any are. */
  private async narrowToScope(
    intent: ModifyPageIntent,
    candidates: PageResolutionCandidate[],
  ): Promise<PageResolutionCandidate[]> {
    if (intent.referenceType !== 'TITLE' || !intent.scope) return candidates;
    const inScope = await this.pageReferenceResolver.filterByScope(
      candidates,
      intent.scope,
    );
    return inScope.length > 0 ? inScope : candidates;
  }

  /**
   * M2: "… vào trang tôi sửa hôm qua". The Page comes from the user's own
   * activities and is always confirmed by the user (kế hoạch M2, B5).
   */
  private async planFromActivity(
    input: PlanPageInstructionInput,
    intent: Extract<ModifyPageIntent, { referenceType: 'ACTIVITY' }>,
  ): Promise<PageInstructionPlanningResult> {
    // B7: the activity words after "trang" are the target, never an edit;
    // the edit clause itself passes the usual admission.
    if (
      !isSupportedActivityModification(input.instruction, intent.instruction)
    ) {
      return {
        status: 'UNSUPPORTED_OPERATION',
        intent,
        reason: 'INSERT_ONLY',
        detail: explainUnsupportedModification(intent.instruction),
      };
    }
    if (isBareChecklistRequest(intent.instruction)) {
      return missingChecklistItems(intent, []);
    }
    const found = await this.pageReferenceResolver.resolveFromActivity({
      userId: input.userId,
      workspaceId: input.workspaceId,
      activity: intent.activity,
      timeZone: input.timeZone,
      shareToken: input.shareToken,
    });
    if (found.status === 'NOT_FOUND')
      return { status: 'PAGE_NOT_FOUND', intent };
    if (input.selectedPageId) {
      // Only a Page that is still among the user's edits may be planned.
      const selected = found.candidates.find(
        (candidate) => candidate.pageId === input.selectedPageId,
      );
      if (!selected) return { status: 'PAGE_NOT_FOUND', intent };
      return this.createPlan(input, intent, selected, 'ACTIVITY');
    }
    return {
      status: 'AMBIGUOUS_PAGE',
      intent,
      candidates: found.candidates,
      resolutionMethod: 'ACTIVITY',
    };
  }

  /**
   * M6: "… vào trang về <mô tả>". A sentence that ends with one real title
   * still goes by that title (G4); otherwise the Pages closest to the
   * description are offered.
   */
  private async planFromDescription(
    input: PlanPageInstructionInput,
    intent: Extract<ModifyPageIntent, { referenceType: 'DESCRIPTION' }>,
  ): Promise<PageInstructionPlanningResult> {
    // G5: the description names the Page, never an edit; the edit clause
    // itself passes the usual admission.
    if (
      !isSupportedDescriptionModification(
        input.instruction,
        intent.instruction,
        intent.description,
      )
    ) {
      return {
        status: 'UNSUPPORTED_OPERATION',
        intent,
        reason: 'INSERT_ONLY',
        detail: explainUnsupportedModification(intent.instruction),
      };
    }
    if (isBareChecklistRequest(intent.instruction)) {
      return missingChecklistItems(intent, []);
    }
    const found = await this.pageReferenceResolver.resolveFromSentence({
      userId: input.userId,
      workspaceId: input.workspaceId,
      instruction: input.instruction,
      shareToken: input.shareToken,
    });
    if (found.status === 'CANDIDATES' && found.candidates.length === 1) {
      const [only] = found.candidates;
      if (endsWithExactPageTitle(input.instruction, only.title)) {
        if (input.selectedPageId && input.selectedPageId !== only.pageId)
          return { status: 'PAGE_NOT_FOUND', intent };
        const named: ModifyPageIntent = {
          intent: 'MODIFY_PAGE',
          referenceType: 'TITLE',
          pageReference: only.title,
          instruction: intent.instruction,
          needsClarification: false,
        };
        return this.createPlan(input, named, only, 'EXACT_TITLE');
      }
    }
    return this.planFromDescribedPages(input, intent, intent.description, {
      status: 'PAGE_NOT_FOUND',
      intent,
    });
  }

  /**
   * M6 (G3, G5): Pages close to the words, always picked by the user. No
   * vectors, or no AI service to embed the words, ends as before.
   */
  private async planFromDescribedPages(
    input: PlanPageInstructionInput,
    intent: ModifyPageIntent,
    description: string,
    noMatch: PageInstructionPlanningResult,
  ): Promise<PageInstructionPlanningResult> {
    if (!this.pageSearch) return noMatch;
    let matches: PageEmbeddingMatch[];
    try {
      matches = describedPageMatches(
        await this.pageSearch.search({
          userId: input.userId,
          workspaceId: input.workspaceId,
          query: description,
          limit: DESCRIBED_PAGE_SEARCH_LIMIT,
          shareToken: input.shareToken,
        }),
      );
    } catch (error) {
      this.logger.warn(
        `described_page_search_failed reason=${error instanceof Error ? error.constructor.name : 'unknown'}`,
      );
      return noMatch;
    }
    const candidates = await this.narrowToScope(
      intent,
      matches.map((match) => match.page),
    );
    if (!candidates.length) return noMatch;
    // The typed name was already admitted as data (M1b, hướng A).
    if (
      intent.referenceType === 'TITLE' &&
      intent.pageReference &&
      isBareChecklistRequest(input.instruction, [intent.pageReference])
    ) {
      return missingChecklistItems(intent, []);
    }
    if (input.selectedPageId) {
      const selected = candidates.find(
        (candidate) => candidate.pageId === input.selectedPageId,
      );
      if (!selected) return { status: 'PAGE_NOT_FOUND', intent };
      return this.createPlan(input, intent, selected, 'SEMANTIC');
    }
    return {
      status: 'AMBIGUOUS_PAGE',
      intent,
      candidates,
      resolutionMethod: 'SEMANTIC',
    };
  }

  private async createPlan(
    input: PlanPageInstructionInput,
    intent: ModifyPageIntent,
    page: import('../resolution/page-resolution.types').PageResolutionCandidate,
    resolutionMethod: PlanningResolutionMethod,
  ): Promise<PageInstructionPlanningResult> {
    // Only the real title is data here, never a name the AI service extracted.
    if (isBareChecklistRequest(input.instruction, [page.title])) {
      return missingChecklistItems(intent, [page.title]);
    }

    // The resolver has already checked PAGE_READ and workspace boundaries.
    // The existing planner loads fresh authorized Page Context again.
    const plan = await this.modificationPlanner.generate({
      userId: input.userId,
      requestId: input.requestId,
      pageId: page.pageId,
      instruction: intent.instruction,
      originalInstruction: input.instruction,
      // A conversation of another Page is not reused: the planner opens a new
      // PAGE conversation, so the old one is never written to.
      conversationId:
        input.conversationPageId !== undefined &&
        input.conversationPageId !== page.pageId
          ? undefined
          : input.conversationId,
      shareToken: input.shareToken,
    });

    // A draft may only refer to the Page selected by authorized resolution.
    if (plan.pageId !== page.pageId) {
      throw new BadGatewayException('AI modification plan target mismatch');
    }
    if (plan.status !== 'PLAN_READY' && plan.status !== 'NEED_MORE_CONTEXT') {
      throw new BadGatewayException('AI modification plan status is invalid');
    }
    const resultBase = {
      intent,
      page,
      resolutionMethod,
    } as const;
    if (plan.status === 'NEED_MORE_CONTEXT') {
      return {
        ...resultBase,
        status: 'PLAN_NEEDS_MORE_CONTEXT',
        plan,
      };
    }
    return {
      ...resultBase,
      status: 'PLAN_GENERATED',
      plan,
    };
  }
}
