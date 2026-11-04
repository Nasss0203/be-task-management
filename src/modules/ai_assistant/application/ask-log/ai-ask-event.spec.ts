import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';

import type { AiAskResponse } from '../dto/response/ai-ask.response';
import {
  askEventFromError,
  askEventFromResponse,
  MAX_LOGGED_INSTRUCTION_LENGTH,
  type AiAskEvent,
  type AiAskEventLog,
  type AskEventRequest,
} from './ai-ask-event';
import {
  AiAskEventRecorder,
  INSTRUCTION_RETENTION_MS,
} from './ai-ask-event-recorder.service';

// A word that must never reach a log row unless instruction text is enabled.
const SECRET = 'MarkerZebra';

const request: AskEventRequest = {
  userId: 'user-1',
  workspaceId: 'workspace-1',
  requestId: 'request-1',
  instruction: `thêm checklist vào trang ${SECRET}`,
  currentPageId: 'page-open',
  findOnly: false,
};

const intent = {
  intent: 'MODIFY_PAGE',
  referenceType: 'TITLE',
  pageReference: SECRET,
  instruction: 'thêm checklist',
};

const ask = (response: Record<string, unknown>) =>
  ({
    requestId: 'request-1',
    assistantMessage: SECRET,
    ...response,
  }) as unknown as AiAskResponse;

describe('askEventFromResponse (kế hoạch ghi log Ask)', () => {
  it('keeps the reason of a business answer', () => {
    const event = askEventFromResponse(
      request,
      ask({
        intent: 'OTHER',
        status: 'UNSUPPORTED_REQUEST',
        reason: 'M0_CAPABILITY_UNAVAILABLE',
        capability: null,
      }),
      12.4,
      false,
    );
    expect(event).toMatchObject({
      kind: 'ASK',
      intent: 'OTHER',
      status: 'UNSUPPORTED_REQUEST',
      reason: 'M0_CAPABILITY_UNAVAILABLE',
      durationMs: 12,
      generationId: null,
      instruction: null,
      flags: { currentPage: true },
    });
  });

  it('records how Pages were offered to pick, without their titles', () => {
    const event = askEventFromResponse(
      { ...request, findOnly: true, shareToken: 'token' },
      ask({
        intent: 'MODIFY_PAGE',
        status: 'AMBIGUOUS_PAGE',
        capability: 'GENERATE_PAGE_MODIFICATION_PLAN',
        planning: {
          status: 'AMBIGUOUS_PAGE',
          intent: { ...intent, basedOn: SECRET },
          candidates: [
            { id: 'a', title: SECRET },
            { id: 'b', title: SECRET },
          ],
          resolutionMethod: 'FUZZY_TITLE',
          scopeUnmatched: true,
        },
      }),
      5,
      false,
    );
    expect(event).toMatchObject({
      status: 'AMBIGUOUS_PAGE',
      referenceType: 'TITLE',
      resolutionMethod: 'FUZZY_TITLE',
      candidateCount: 2,
      flags: {
        basedOn: true,
        scopeUnmatched: true,
        findOnly: true,
        shareToken: true,
        currentPage: true,
      },
    });
    expect(JSON.stringify(event)).not.toContain(SECRET);
  });

  it('links a draft and never stores its instruction', () => {
    const event = askEventFromResponse(
      { ...request, selectedPageId: 'page-picked' },
      ask({
        intent: 'MODIFY_PAGE',
        status: 'PLAN_GENERATED',
        capability: 'GENERATE_PAGE_MODIFICATION_PLAN',
        generationId: 'generation-1',
        planning: {
          status: 'PLAN_GENERATED',
          intent,
          resolutionMethod: 'ACTIVITY',
          plan: {},
        },
      }),
      30_000,
      true,
    );
    expect(event).toMatchObject({
      generationId: 'generation-1',
      capability: 'GENERATE_PAGE_MODIFICATION_PLAN',
      resolutionMethod: 'ACTIVITY',
      flags: { selectedPage: true },
      instruction: null,
    });
  });

  it('keeps the first reason of a draft that needs more context', () => {
    const event = askEventFromResponse(
      request,
      ask({
        intent: 'MODIFY_PAGE',
        status: 'PLAN_NEEDS_MORE_CONTEXT',
        capability: 'GENERATE_PAGE_MODIFICATION_PLAN',
        generationId: 'generation-2',
        planning: {
          status: 'PLAN_NEEDS_MORE_CONTEXT',
          intent,
          resolutionMethod: 'EXACT_TITLE',
          plan: {
            contextRequests: [{ reason: 'AMBIGUOUS_TARGET', question: SECRET }],
          },
        },
      }),
      1,
      false,
    );
    expect(event.reason).toBe('AMBIGUOUS_TARGET');
    expect(JSON.stringify(event)).not.toContain(SECRET);
  });

  it('keeps only the kind of an unsupported edit, not the blocked word', () => {
    const event = askEventFromResponse(
      request,
      ask({
        intent: 'MODIFY_PAGE',
        status: 'UNSUPPORTED_OPERATION',
        capability: 'GENERATE_PAGE_MODIFICATION_PLAN',
        planning: {
          status: 'UNSUPPORTED_OPERATION',
          intent,
          reason: 'INSERT_ONLY',
          detail: { kind: 'BLOCKED_WORD', term: SECRET, pageAction: true },
        },
      }),
      1,
      false,
    );
    expect(event.reason).toBe('INSERT_ONLY:BLOCKED_WORD');
    expect(JSON.stringify(event)).not.toContain(SECRET);
  });

  it('stores a cut instruction only when enabled and no draft was made', () => {
    const long = { ...request, instruction: 'x'.repeat(500) };
    const unclear = ask({
      intent: 'UNCLEAR',
      status: 'NEEDS_CLARIFICATION',
      reason: 'UNCLEAR_INTENT',
      capability: null,
    });
    expect(
      askEventFromResponse(long, unclear, 1, false).instruction,
    ).toBeNull();
    expect(
      askEventFromResponse(long, unclear, 1, true).instruction,
    ).toHaveLength(MAX_LOGGED_INSTRUCTION_LENGTH);
  });
});

describe('askEventFromError', () => {
  it('records the HTTP status of a failed Ask', () => {
    const event = askEventFromError(
      request,
      new ServiceUnavailableException(SECRET),
      7,
      false,
    );
    expect(event).toMatchObject({
      status: 'ERROR',
      errorCode: 'HTTP_503',
      instruction: null,
    });
    expect(JSON.stringify(event)).not.toContain(SECRET);
  });
});

describe('AiAskEventRecorder', () => {
  const unclear = ask({
    intent: 'UNCLEAR',
    status: 'NEEDS_CLARIFICATION',
    reason: 'UNCLEAR_INTENT',
    capability: null,
  });
  let log: {
    record: jest.Mock<Promise<void>, [AiAskEvent]>;
    clearInstructionsBefore: jest.Mock<Promise<number>, [Date]>;
  };
  const recorder = (logText?: string) =>
    new AiAskEventRecorder(
      log as unknown as AiAskEventLog,
      { get: jest.fn(() => logText) } as unknown as ConfigService,
    );

  beforeEach(() => {
    log = {
      record: jest.fn<Promise<void>, [AiAskEvent]>(() => Promise.resolve()),
      clearInstructionsBefore: jest.fn<Promise<number>, [Date]>(() =>
        Promise.resolve(3),
      ),
    };
  });

  it('returns the Ask result and records it once', async () => {
    await expect(
      recorder().trackAsk(request, () => Promise.resolve(unclear)),
    ).resolves.toBe(unclear);
    expect(log.record).toHaveBeenCalledTimes(1);
    expect(log.record.mock.calls[0][0]).toMatchObject({
      status: 'NEEDS_CLARIFICATION',
      instruction: null,
    });
  });

  it('stores the instruction only with AI_ASK_LOG_TEXT=true', async () => {
    await recorder('true').trackAsk(request, () => Promise.resolve(unclear));
    expect(log.record.mock.calls[0][0].instruction).toBe(request.instruction);
  });

  it('never fails the Ask when recording fails', async () => {
    log.record.mockRejectedValue(new Error('db down'));
    await expect(
      recorder().trackAsk(request, () => Promise.resolve(unclear)),
    ).resolves.toBe(unclear);
  });

  it('records a failed Ask and rethrows the same error', async () => {
    const error = new ServiceUnavailableException('AI down');
    await expect(
      recorder().trackAsk(request, () => Promise.reject(error)),
    ).rejects.toBe(error);
    expect(log.record.mock.calls[0][0]).toMatchObject({
      status: 'ERROR',
      errorCode: 'HTTP_503',
    });
  });

  it('records an Undo', async () => {
    await recorder().recordUndo({
      userId: 'user-1',
      workspaceId: 'workspace-1',
      generationId: 'g-1',
      durationMs: 40.6,
    });
    expect(log.record.mock.calls[0][0]).toMatchObject({
      kind: 'UNDO',
      status: 'UNDONE',
      generationId: 'g-1',
      durationMs: 41,
      requestId: null,
    });
  });

  it('clears instructions older than 30 days, and survives a failure', async () => {
    const now = new Date('2026-10-31T00:00:00Z');
    await expect(recorder().clearOldInstructions(now)).resolves.toBe(3);
    expect(log.clearInstructionsBefore).toHaveBeenCalledWith(
      new Date(now.getTime() - INSTRUCTION_RETENTION_MS),
    );
    log.clearInstructionsBefore.mockRejectedValue(new Error('db down'));
    await expect(recorder().clearOldInstructions(now)).resolves.toBe(0);
  });
});
