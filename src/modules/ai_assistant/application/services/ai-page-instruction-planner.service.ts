import {
  BadGatewayException,
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PageIntentExtractionService } from '../resolution/page-intent-extraction.service';
import { PageReferenceResolver } from '../resolution/page-reference-resolver.service';
import type {
  PageInstructionPlanningResult,
  PlanningResolutionMethod,
} from '../resolution/page-instruction-planning.types';
import { AiModificationPlannerService } from './ai-modification-planner.service';
import { isSupportedModification } from './ai-modification-operation.policy';

type ModifyPageIntent = Extract<
  Awaited<ReturnType<PageIntentExtractionService['extract']>>['result'],
  { intent: 'MODIFY_PAGE' }
>;

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
      return { status: 'UNSUPPORTED_OPERATION', intent, reason: 'INSERT_ONLY' };
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
   * M1b: look for real Page names in the user's own words. A match is only
   * ever offered for selection; the planner runs after an explicit choice.
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
    if (
      !isSupportedModification(
        input.instruction,
        found.candidates.map((candidate) => candidate.title),
      )
    ) {
      return { status: 'UNSUPPORTED_OPERATION', intent, reason: 'INSERT_ONLY' };
    }
    if (input.selectedPageId) {
      const selected = found.candidates.find(
        (candidate) => candidate.pageId === input.selectedPageId,
      );
      if (!selected) return { status: 'PAGE_NOT_FOUND', intent };
      return this.createPlan(input, intent, selected, found.resolutionMethod);
    }
    return {
      status: 'AMBIGUOUS_PAGE',
      intent,
      candidates: found.candidates,
      resolutionMethod: found.resolutionMethod,
    };
  }

  private async createPlan(
    input: PlanPageInstructionInput,
    intent: ModifyPageIntent,
    page: import('../resolution/page-resolution.types').PageResolutionCandidate,
    resolutionMethod: PlanningResolutionMethod,
  ): Promise<PageInstructionPlanningResult> {

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
