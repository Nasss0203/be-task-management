import type { AiIntent } from '../../ports/ai-intent.port';
import type { PageInstructionPlanningResult } from '../../resolution/page-instruction-planning.types';
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
  );
