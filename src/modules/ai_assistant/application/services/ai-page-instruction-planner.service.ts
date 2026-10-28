import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PageIntentExtractionService } from '../resolution/page-intent-extraction.service';
import { PageReferenceResolver } from '../resolution/page-reference-resolver.service';
import { endsWithExactPageTitle } from '../resolution/page-title-sentence-matcher';
import type {
  PageInstructionPlanningResult,
  PlanningResolutionMethod,
} from '../resolution/page-instruction-planning.types';
import { AiModificationPlannerService } from './ai-modification-planner.service';
import {
  explainUnsupportedModification,
  isBareChecklistRequest,
  isSupportedActivityModification,
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
  constructor(
    private readonly extractionService: PageIntentExtractionService,
    private readonly pageReferenceResolver: PageReferenceResolver,
    private readonly modificationPlanner: AiModificationPlannerService,
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

    if (
      typeof intent.instruction !== 'string' ||
      !intent.instruction.trim()
    ) {
      throw new BadGatewayException('AI page instruction is invalid');
    }
    if (intent.referenceType === 'ACTIVITY') {
      return this.planFromActivity(input, intent);
    }

    const unresolved =
      intent.needsClarification || intent.referenceType === 'UNRESOLVED';
    // The name the AI service took from this source is data (M1b, hướng A).
    // Without any name yet, the original is checked once real names are known.
    const extractedNames =
      intent.referenceType === 'TITLE' && intent.pageReference
        ? [intent.pageReference]
        : [];
    if (
      !isSupportedModification(intent.instruction) ||
      (!unresolved &&
        !isSupportedModification(input.instruction, extractedNames))
    ) {
      return {
        status: 'UNSUPPORTED_OPERATION',
        intent,
        reason: 'INSERT_ONLY',
        detail: explainUnsupportedModification(
          input.instruction,
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

    if (
      intent.referenceType === 'CURRENT_PAGE' &&
      !input.currentPageId
    ) {
      return {
        status: 'NEEDS_CLARIFICATION',
        reason: 'MISSING_CURRENT_PAGE',
        intent,
      };
    }

    if (input.selectedPageId && intent.referenceType !== 'TITLE') {
      throw new BadRequestException('Selected Page requires an explicit Page title');
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

    if (input.selectedPageId && resolution.page.pageId !== input.selectedPageId) {
      return { status: 'PAGE_NOT_FOUND', intent };
    }

    return this.createPlan(
      input, intent, resolution.page, resolution.resolutionMethod,
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
    if (found.status === 'NOT_FOUND') return noMatch;
    if (found.status === 'TOO_MANY') {
      return {
        status: 'NEEDS_CLARIFICATION',
        reason: 'UNRESOLVED_PAGE',
        intent,
      };
    }
    // Deciding admission check: only names of real, readable Pages are data.
    // Runs before any candidate is shown and before any draft is generated.
    const titles = found.candidates.map((candidate) => candidate.title);
    if (!isSupportedModification(input.instruction, titles)) {
      return {
        status: 'UNSUPPORTED_OPERATION',
        intent,
        reason: 'INSERT_ONLY',
        detail: explainUnsupportedModification(input.instruction, titles),
      };
    }
    if (isBareChecklistRequest(input.instruction, titles)) {
      return missingChecklistItems(intent, titles);
    }
    if (input.selectedPageId) {
      const selected = found.candidates.find(
        (candidate) => candidate.pageId === input.selectedPageId,
      );
      if (!selected) return { status: 'PAGE_NOT_FOUND', intent };
      return this.createPlan(input, intent, selected, found.resolutionMethod);
    }
    // "… trong trang sub man" names one real Page exactly: nothing to choose.
    // The title now comes from the user's words, so the intent is resolved.
    const [only] = found.candidates;
    if (
      found.candidates.length === 1 &&
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
      candidates: found.candidates,
      resolutionMethod: found.resolutionMethod,
    };
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
