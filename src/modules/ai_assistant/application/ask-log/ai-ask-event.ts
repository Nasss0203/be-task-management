import { HttpException } from '@nestjs/common';

import type { AiAskResponse } from '../dto/response/ai-ask.response';

/** Kế hoạch ghi log Ask (L2a): the stored instruction is cut to this length. */
export const MAX_LOGGED_INSTRUCTION_LENGTH = 300;

/** Only yes/no facts about the request; never its words (L1). */
export interface AiAskEventFlags {
  selectedPage?: true;
  basedOn?: true;
  findOnly?: true;
  scopeUnmatched?: true;
  currentPage?: true;
  selectedText?: true;
  shareToken?: true;
}

/** One row of ai_ask_events: codes and counts only (L1, L2). */
export interface AiAskEvent {
  kind: 'ASK' | 'UNDO';
  userId: string;
  workspaceId: string;
  requestId: string | null;
  intent: string | null;
  status: string;
  reason: string | null;
  referenceType: string | null;
  resolutionMethod: string | null;
  candidateCount: number | null;
  flags: AiAskEventFlags;
  capability: string | null;
  generationId: string | null;
  durationMs: number;
  errorCode: string | null;
  /** L2a: only for an Ask that made no draft, and only when enabled. */
  instruction: string | null;
}

export interface AiAskEventLog {
  record(event: AiAskEvent): Promise<void>;
  /** L8: forget stored instructions older than `before`; returns rows changed. */
  clearInstructionsBefore(before: Date): Promise<number>;
}

/** What the Ask request said, as far as the log needs it. */
export interface AskEventRequest {
  userId: string;
  workspaceId: string;
  requestId: string;
  instruction: string;
  currentPageId?: string | null;
  selectedPageId?: string | null;
  selectedText?: string | null;
  shareToken?: string;
  findOnly: boolean;
}

function requestFlags(request: AskEventRequest): AiAskEventFlags {
  return {
    ...(request.selectedPageId ? { selectedPage: true as const } : {}),
    ...(request.currentPageId ? { currentPage: true as const } : {}),
    ...(request.selectedText ? { selectedText: true as const } : {}),
    ...(request.shareToken ? { shareToken: true as const } : {}),
    ...(request.findOnly ? { findOnly: true as const } : {}),
  };
}

function loggedInstruction(
  request: AskEventRequest,
  madeDraft: boolean,
  logText: boolean,
): string | null {
  if (!logText || madeDraft) return null;
  return request.instruction.slice(0, MAX_LOGGED_INSTRUCTION_LENGTH);
}

/**
 * A code only: an unsupported edit keeps its `detail.kind` (never the blocked
 * word itself); a draft that needs more context keeps its first reason.
 */
function responseReason(response: AiAskResponse): string | null {
  if ('reason' in response) return response.reason;
  if (!('planning' in response)) return null;
  const planning = response.planning;
  if (planning.status === 'UNSUPPORTED_OPERATION')
    return planning.detail
      ? `${planning.reason}:${planning.detail.kind}`
      : planning.reason;
  if (planning.status === 'NEEDS_CLARIFICATION') return planning.reason;
  if (planning.status === 'PLAN_NEEDS_MORE_CONTEXT')
    return planning.plan.contextRequests[0]?.reason ?? null;
  return null;
}

/** L3: one row from the response Ask returned. */
export function askEventFromResponse(
  request: AskEventRequest,
  response: AiAskResponse,
  durationMs: number,
  logText: boolean,
): AiAskEvent {
  const planning = 'planning' in response ? response.planning : undefined;
  const intent = planning && 'intent' in planning ? planning.intent : undefined;
  const generationId =
    'generationId' in response ? (response.generationId ?? null) : null;
  const reason = responseReason(response);
  return {
    kind: 'ASK',
    userId: request.userId,
    workspaceId: request.workspaceId,
    requestId: request.requestId,
    intent: response.intent ?? null,
    status: response.status,
    reason: reason ? reason.slice(0, 60) : null,
    referenceType:
      intent && 'referenceType' in intent ? intent.referenceType : null,
    resolutionMethod:
      planning && 'resolutionMethod' in planning
        ? (planning.resolutionMethod ?? null)
        : null,
    candidateCount:
      planning && 'candidates' in planning ? planning.candidates.length : null,
    flags: {
      ...requestFlags(request),
      ...(intent && 'basedOn' in intent && intent.basedOn
        ? { basedOn: true as const }
        : {}),
      ...(planning && 'scopeUnmatched' in planning && planning.scopeUnmatched
        ? { scopeUnmatched: true as const }
        : {}),
    },
    capability: response.capability ?? null,
    generationId,
    durationMs: Math.max(0, Math.round(durationMs)),
    errorCode: null,
    instruction: loggedInstruction(request, generationId !== null, logText),
  };
}

/** L3: an Ask that threw (bad input, no access, the AI service down). */
export function askEventFromError(
  request: AskEventRequest,
  error: unknown,
  durationMs: number,
  logText: boolean,
): AiAskEvent {
  const errorCode =
    error instanceof HttpException
      ? `HTTP_${error.getStatus()}`
      : error instanceof Error
        ? error.name.slice(0, 40)
        : 'UNKNOWN';
  return {
    kind: 'ASK',
    userId: request.userId,
    workspaceId: request.workspaceId,
    requestId: request.requestId,
    intent: null,
    status: 'ERROR',
    reason: null,
    referenceType: null,
    resolutionMethod: null,
    candidateCount: null,
    flags: requestFlags(request),
    capability: null,
    generationId: null,
    durationMs: Math.max(0, Math.round(durationMs)),
    errorCode,
    instruction: loggedInstruction(request, false, logText),
  };
}
