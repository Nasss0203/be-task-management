import type { UnsupportedModificationDetail } from '../services/ai-modification-operation.policy';
import type { GenerateAiModificationPlanResult } from '../services/ai-modification-planner.service';
import type { PlanSource } from '../embedding/page-source-references.service';
import type { PageIntentExtraction } from './page-intent.types';
import type { PageResolutionCandidate } from './page-resolution.types';

/** TITLE_IN_SENTENCE only follows an explicit user choice (M1b). */
export type PlanningResolutionMethod =
  | 'CURRENT_CONTEXT'
  | 'EXACT_TITLE'
  | 'TITLE_IN_SENTENCE'
  // M2: like TITLE_IN_SENTENCE, only after the user picked the Page.
  | 'ACTIVITY'
  // M3: a title close to the typed name, also only after the user picked it.
  | 'FUZZY_TITLE'
  // M6: a Page close to a description, also only after the user picked it.
  | 'SEMANTIC'
  // M7: a Page whose text is close to the words, also only after a pick.
  | 'CONTENT';

/** Non-planning results never create an AI Generation or change a Page. */
export type PageInstructionPlanningResult =
  | {
      status: 'UNSUPPORTED_OPERATION';
      intent: PageIntentExtraction;
      reason: 'INSERT_ONLY';
      /** Why it was refused; only chooses the reply (kế hoạch sửa nhỏ, D3). */
      detail?: UnsupportedModificationDetail;
    }
  | {
      status: 'NOT_A_PAGE_MODIFICATION';
      intent: PageIntentExtraction;
    }
  | {
      status: 'NEEDS_CLARIFICATION';
      reason:
        | 'UNCLEAR_INTENT'
        | 'UNRESOLVED_PAGE'
        | 'MISSING_CURRENT_PAGE'

        // gp02: "thêm checklist" with neither items nor a topic.
        | 'MISSING_CHECKLIST_ITEMS'
        // M8: nothing readable was found in the source the user named.
        | 'MISSING_SOURCE';
      intent: PageIntentExtraction;
      /** MISSING_CHECKLIST_ITEMS: the one real, readable Page title found. */
      pageTitle?: string;
    }
  | {
      status: 'PAGE_NOT_FOUND';
      intent: PageIntentExtraction;
    }
  | {
      // The user must pick one: duplicate exact titles, or M1b sentence matches.
      status: 'AMBIGUOUS_PAGE';
      intent: PageIntentExtraction;
      candidates: PageResolutionCandidate[];
      resolutionMethod?:
        | 'TITLE_IN_SENTENCE'
        | 'ACTIVITY'
        | 'FUZZY_TITLE'
        | 'SEMANTIC'
        | 'CONTENT';
      /** M4: no candidate is in the place the user named; all are offered. */
      scopeUnmatched?: true;
    }
  | {
      status: 'PLAN_GENERATED';
      intent: PageIntentExtraction;
      page: PageResolutionCandidate;
      resolutionMethod: PlanningResolutionMethod;
      /** M8 (I7): the Pages the draft was based on. */
      sources?: PlanSource[];
      plan: Extract<GenerateAiModificationPlanResult, { status: 'PLAN_READY' }>;
    }
  | {
      // A generation is persisted, but no executable operations exist.
      status: 'PLAN_NEEDS_MORE_CONTEXT';
      intent: PageIntentExtraction;
      page: PageResolutionCandidate;
      resolutionMethod: PlanningResolutionMethod;
      sources?: PlanSource[];
      plan: Extract<
        GenerateAiModificationPlanResult,
        { status: 'NEED_MORE_CONTEXT' }
      >;
    };
