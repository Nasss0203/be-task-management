import { performance } from 'node:perf_hooks';

import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AI_ASSISTANT_TYPES } from '../../ai-assistant.types';
import type { AiAskResponse } from '../dto/response/ai-ask.response';
import {
  askEventFromError,
  askEventFromResponse,
  type AiAskEvent,
  type AiAskEventLog,
  type AskEventRequest,
} from './ai-ask-event';

/** L8: stored instructions are forgotten after 30 days. */
export const INSTRUCTION_RETENTION_MS = 30 * 86_400_000;
const CLEANUP_INTERVAL_MS = 86_400_000;
const FIRST_CLEANUP_DELAY_MS = 60_000;

/**
 * Kế hoạch ghi log Ask: one row per Ask and per Undo, for the real-user
 * evaluation. Recording never changes or fails the request it describes (L4).
 * Instructions are kept only when AI_ASK_LOG_TEXT=true (L2a).
 */
@Injectable()
export class AiAskEventRecorder implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiAskEventRecorder.name);
  private timers: NodeJS.Timeout[] = [];

  constructor(
    @Inject(AI_ASSISTANT_TYPES.ports.AiAskEventLog)
    private readonly log: AiAskEventLog,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    const first = setTimeout(
      () => void this.clearOldInstructions(),
      FIRST_CLEANUP_DELAY_MS,
    );
    const daily = setInterval(
      () => void this.clearOldInstructions(),
      CLEANUP_INTERVAL_MS,
    );
    first.unref();
    daily.unref();
    this.timers = [first, daily];
  }

  onModuleDestroy(): void {
    for (const timer of this.timers) clearTimeout(timer);
  }

  private get logText(): boolean {
    return this.configService.get<string>('AI_ASK_LOG_TEXT') === 'true';
  }

  /** Runs one Ask and records how it ended; the result or error is unchanged. */
  async trackAsk(
    request: AskEventRequest,
    run: () => Promise<AiAskResponse>,
  ): Promise<AiAskResponse> {
    const started = performance.now();
    try {
      const response = await run();
      await this.save(
        askEventFromResponse(
          request,
          response,
          performance.now() - started,
          this.logText,
        ),
      );
      return response;
    } catch (error) {
      await this.save(
        askEventFromError(
          request,
          error,
          performance.now() - started,
          this.logText,
        ),
      );
      throw error;
    }
  }

  /** L5: a successful Undo of an applied draft. */
  async recordUndo(event: {
    userId: string;
    workspaceId: string;
    generationId: string;
    durationMs: number;
  }): Promise<void> {
    await this.save({
      kind: 'UNDO',
      userId: event.userId,
      workspaceId: event.workspaceId,
      requestId: null,
      intent: null,
      status: 'UNDONE',
      reason: null,
      referenceType: null,
      resolutionMethod: null,
      candidateCount: null,
      flags: {},
      capability: null,
      generationId: event.generationId,
      durationMs: Math.max(0, Math.round(event.durationMs)),
      errorCode: null,
      instruction: null,
    });
  }

  async clearOldInstructions(now: Date = new Date()): Promise<number> {
    try {
      const cleared = await this.log.clearInstructionsBefore(
        new Date(now.getTime() - INSTRUCTION_RETENTION_MS),
      );
      if (cleared > 0) this.logger.log(`ai_ask_events_text_cleared=${cleared}`);
      return cleared;
    } catch {
      this.logger.warn('ai_ask_events_text_clear_failed');
      return 0;
    }
  }

  private async save(event: AiAskEvent): Promise<void> {
    try {
      await this.log.record(event);
    } catch {
      // L4: no request text in the warning, and the Ask result stays as is.
      this.logger.warn(
        `ai_ask_event_not_recorded kind=${event.kind} status=${event.status}`,
      );
    }
  }
}
