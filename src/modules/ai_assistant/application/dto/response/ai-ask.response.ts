import type { AiIntent } from '../../ports/ai-intent.port';
import type { PageInstructionPlanningResult } from '../../resolution/page-instruction-planning.types';
import type { PageResolutionCandidate } from '../../resolution/page-resolution.types';
import type { PageQuestionKind } from '../../ports/ai-intent.port';
import type { AiGenerationResponseDto } from './ai-generation.response.dto';
import type { AiModificationPlanPreviewResponseDto } from './ai-modification-plan-preview.response.dto';

interface AskResponseBase {
  requestId: string;
  intent: AiIntent;
  assistantMessage: string;
}

/**
 * Chat nhiều lượt: set when the sent conversation did not fit the request and
 * the server opened a new one (conversationId differs from the request's).
 */
interface ConversationSwitch {
  conversationSwitched?: true;
}

type PlanningResponse = {
  [Status in PageInstructionPlanningResult['status']]: {
    status: Status;
    capability: 'GENERATE_PAGE_MODIFICATION_PLAN';
    planning: Extract<PageInstructionPlanningResult, { status: Status }>;
  } & (Status extends 'PLAN_GENERATED' | 'PLAN_NEEDS_MORE_CONTEXT'
    ? {
        generationId: string;
        conversationId: string;
        preview: AiModificationPlanPreviewResponseDto;
      } & ConversationSwitch
    : object);
}[PageInstructionPlanningResult['status']];

export type AiAskResponse = AskResponseBase &
  (
    | {
        status:
          | 'NEEDS_CLARIFICATION'
          | 'UNSUPPORTED_REQUEST'
          | 'UNSUPPORTED_OPERATION';
        reason: string;
        capability: null;
      }
    | ({
        status: 'GENERATION_CREATED';
        capability: string;
        conversationId: string;
        generationId: string;
        generation: AiGenerationResponseDto;
      } & ConversationSwitch)
    | PlanningResponse
    | ({
        status: 'ANSWERED';
        intent: 'PAGE_QUESTION';
        capability: 'PAGE_QUESTION';
        reason: PageQuestionKind;
        conversationId: string;
        page: { pageId: string; title: string };
        usedModel: boolean;
      } & ConversationSwitch)
    | {
        status: 'AMBIGUOUS_PAGE';
        intent: 'PAGE_QUESTION';
        capability: 'PAGE_QUESTION';
        candidates: PageResolutionCandidate[];
        resolutionMethod?: 'TITLE_IN_SENTENCE' | 'FUZZY_TITLE';
      }
  );
