import type { GenerateAiModificationPlanResult } from '../services/ai-modification-planner.service';
import type { PageIntentExtraction } from './page-intent.types';
import type { PageResolutionCandidate } from './page-resolution.types';

/** Non-planning results never create an AI Generation or change a Page. */
export type PageInstructionPlanningResult =
  | {
      status: 'NOT_A_PAGE_MODIFICATION';
      intent: PageIntentExtraction;
    }
  | {
      status: 'NEEDS_CLARIFICATION';
      reason: 'UNCLEAR_INTENT' | 'UNRESOLVED_PAGE' | 'MISSING_CURRENT_PAGE';
      intent: PageIntentExtraction;
    }
  | {
      status: 'PAGE_NOT_FOUND';
      intent: PageIntentExtraction;
    }
  | {
      status: 'AMBIGUOUS_PAGE';
      intent: PageIntentExtraction;
      candidates: PageResolutionCandidate[];
    }
  | {
      status: 'PLAN_GENERATED';
      intent: PageIntentExtraction;
      page: PageResolutionCandidate;
      resolutionMethod: 'CURRENT_CONTEXT' | 'EXACT_TITLE';
      plan: Extract<GenerateAiModificationPlanResult, { status: 'PLAN_READY' }>;
    }
  | {
      // A generation is persisted, but no executable operations exist.
      status: 'PLAN_NEEDS_MORE_CONTEXT';
      intent: PageIntentExtraction;
      page: PageResolutionCandidate;
      resolutionMethod: 'CURRENT_CONTEXT' | 'EXACT_TITLE';
      plan: Extract<GenerateAiModificationPlanResult, { status: 'NEED_MORE_CONTEXT' }>;
    };
