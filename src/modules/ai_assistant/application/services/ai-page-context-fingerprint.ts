import { createHash } from 'crypto';
import { ConflictException } from '@nestjs/common';

import type {
  AiDatabaseContextDto,
  AiPageContextResponseDto,
} from '../dto/response/ai-page-context.response.dto';

/** Server-owned snapshot stored in ai_generations.input_data (no migration). */
export interface AiPageContextFingerprint {
  version: 1;
  sha256: string;
}

const STALE_CODE = 'AI_MODIFICATION_PLAN_STALE';

function stale(message: string): ConflictException {
  return new ConflictException({ code: STALE_CODE, message });
}

/** Sort object keys recursively: ORM/JSONB key enumeration order is not stable. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonical);
  }

  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .filter((key) => record[key] !== undefined)
        .map((key) => [key, canonical(record[key])]),
    );
  }

  return value;
}

function byId<T extends { id: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.id.localeCompare(b.id));
}

function normalizedDatabase(database: AiDatabaseContextDto) {
  return {
    ...database,
    properties: byId(database.properties).map((property) => ({
      ...property,
      options: byId(property.options),
    })),
    views: byId(database.views).map((view) => ({
      ...view,
      properties: [...view.properties].sort((a, b) =>
        a.propertyId.localeCompare(b.propertyId),
      ),
    })),
    rows: byId(database.rows),
  };
}

/**
 * Hash all Page data exposed to the Planner, not only page.updatedAt.
 * Canonicalize collections by stable IDs while retaining orderIndex/position,
 * which means moving a block or property still invalidates an old plan.
 * builtAt is deliberately excluded: rebuilding identical context is safe.
 */
export function fingerprintAiPageContext(
  context: AiPageContextResponseDto,
): AiPageContextFingerprint {
  const snapshot = {
    schemaVersion: context.schemaVersion,
    page: context.page,
    blocks: byId(context.blocks),
    databaseReferences: [...context.databaseReferences].sort((a, b) =>
      a.blockId.localeCompare(b.blockId),
    ),
    databases: byId(context.databases).map(normalizedDatabase),
    completeness: {
      ...context.completeness,
      rows: [...context.completeness.rows].sort((a, b) =>
        a.databaseId.localeCompare(b.databaseId),
      ),
    },
  };

  return {
    version: 1,
    sha256: createHash('sha256')
      .update(JSON.stringify(canonical(snapshot)))
      .digest('hex'),
  };
}

export function hasCompleteAiPageContext(context: AiPageContextResponseDto): boolean {
  const completeness = context.completeness;
  return (
    !completeness.textTruncated &&
    !completeness.blocks.truncated &&
    completeness.blocks.included === completeness.blocks.total &&
    !completeness.databases.truncated &&
    completeness.databases.included === completeness.databases.total &&
    completeness.rows.every(
      (rows) => !rows.truncated && rows.included === rows.total,
    )
  );
}

/**
 * Missing/malformed legacy snapshots cannot be validated: force regeneration.
 * A truncated context cannot prove that unseen data is unchanged.
 */
export function assertAiPageContextFresh(
  persisted: unknown,
  currentContext: AiPageContextResponseDto,
): void {
  if (
    typeof persisted !== 'object' ||
    persisted === null ||
    Array.isArray(persisted) ||
    (persisted as Partial<AiPageContextFingerprint>).version !== 1 ||
    typeof (persisted as Partial<AiPageContextFingerprint>).sha256 !==
      'string' ||
    !/^[0-9a-f]{64}$/.test((persisted as AiPageContextFingerprint).sha256)
  ) {
    throw stale(
      'This draft was created without a verifiable Page snapshot. Generate a new plan.',
    );
  }

  if (!hasCompleteAiPageContext(currentContext)) {
    throw stale(
      'The Page context is incomplete. Generate a new plan after reducing truncated content.',
    );
  }

  const actual = fingerprintAiPageContext(currentContext);
  if (actual.sha256 !== (persisted as AiPageContextFingerprint).sha256) {
    throw stale(
      'The Page has changed since this draft was created. Generate a new plan.',
    );
  }
}
