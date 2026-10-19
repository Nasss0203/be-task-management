import { BadRequestException } from '@nestjs/common';

export type TemplateListCursorPayload = {
  createdAt: Date;
  id: string;
  score?: number;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function encodeTemplateListCursor(
  payload: TemplateListCursorPayload,
): string {
  const data = {
    createdAt: payload.createdAt.toISOString(),
    id: payload.id,
    ...(payload.score !== undefined ? { score: payload.score } : {}),
  };
  return Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
}

export function decodeTemplateListCursor(
  cursor: string,
): TemplateListCursorPayload {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw) as unknown;

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof (parsed as Record<string, unknown>).createdAt !== 'string' ||
      typeof (parsed as Record<string, unknown>).id !== 'string'
    ) {
      throw new BadRequestException('Invalid cursor format');
    }

    const { createdAt, id, score } = parsed as {
      createdAt: string;
      id: string;
      score?: unknown;
    };

    if (score !== undefined && !Number.isSafeInteger(score)) {
      throw new BadRequestException('Invalid cursor score');
    }

    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid cursor timestamp');
    }

    if (!UUID_REGEX.test(id)) {
      throw new BadRequestException('Invalid cursor id');
    }

    return {
      createdAt: date,
      id,
      ...(score !== undefined ? { score: score as number } : {}),
    };
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException('Malformed cursor');
  }
}
