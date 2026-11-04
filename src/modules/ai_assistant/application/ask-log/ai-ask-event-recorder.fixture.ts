import type { AiAskEventRecorder } from './ai-ask-event-recorder.service';

/** For specs that do not test logging: runs the Ask as is, records nothing. */
export function passThroughAskLog(): AiAskEventRecorder {
  return {
    trackAsk: (_request: unknown, run: () => Promise<unknown>) => run(),
    recordUndo: jest.fn(() => Promise.resolve()),
  } as unknown as AiAskEventRecorder;
}
