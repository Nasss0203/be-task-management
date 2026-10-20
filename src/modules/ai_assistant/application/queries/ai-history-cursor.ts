import { BadRequestException } from '@nestjs/common';
import type { AiHistoryCursor } from '../../domain/repositories/ai-history-cursor';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function encodeAiHistoryCursor(cursor: AiHistoryCursor): string {
  return Buffer.from(
    JSON.stringify({
      createdAt: cursor.createdAt.toISOString(),
      id: cursor.id,
    }),
    'utf8',
  ).toString('base64url');
}

export function decodeAiHistoryCursor(value: string): AiHistoryCursor {
  try {
    const data = JSON.parse(
      Buffer.from(value, 'base64url').toString('utf8'),
    ) as unknown;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Invalid cursor structure');
    }
    const { createdAt, id } = data as Record<string, unknown>;
    if (typeof createdAt !== 'string' || typeof id !== 'string') {
      throw new Error('Invalid cursor fields');
    }
    const date = new Date(createdAt);
    if (
      !UUID_PATTERN.test(id) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString() !== createdAt
    ) {
      throw new Error('Invalid cursor values');
    }
    return { createdAt: date, id };
  } catch {
    throw new BadRequestException('Invalid AI history cursor');
  }
}
