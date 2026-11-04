import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import type {
  AiAskEvent,
  AiAskEventLog,
} from '../../application/ask-log/ai-ask-event';

/** Kế hoạch ghi log Ask: plain INSERTs outside any request transaction (L4). */
@Injectable()
export class AiAskEventSqlStore implements AiAskEventLog {
  constructor(private readonly dataSource: DataSource) {}

  async record(event: AiAskEvent): Promise<void> {
    await this.dataSource.query(
      `INSERT INTO ai_ask_events (kind, user_id, workspace_id, request_id, intent,
         status, reason, reference_type, resolution_method, candidate_count, flags,
         capability, generation_id, duration_ms, error_code, instruction)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        event.kind,
        event.userId,
        event.workspaceId,
        event.requestId,
        event.intent,
        event.status,
        event.reason,
        event.referenceType,
        event.resolutionMethod,
        event.candidateCount,
        JSON.stringify(event.flags),
        event.capability,
        event.generationId,
        event.durationMs,
        event.errorCode,
        event.instruction,
      ],
    );
  }

  async clearInstructionsBefore(before: Date): Promise<number> {
    // An UPDATE through query() resolves to [rows, affectedCount].
    const result: unknown = await this.dataSource.query(
      `UPDATE ai_ask_events SET instruction = NULL
       WHERE instruction IS NOT NULL AND created_at < $1`,
      [before],
    );
    return Array.isArray(result) && typeof result[1] === 'number'
      ? result[1]
      : 0;
  }
}
