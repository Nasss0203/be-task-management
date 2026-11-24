import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';

import type { PageSearchFilters } from '../../../ports/page-search-reader.port';

const EDITED_WITHIN_DAYS: Record<string, number> = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
};

export const PRIVATE_TEAMSPACE_FILTER = 'private';

export function parsePageSearchFilters(raw: {
  createdBy?: unknown;
  teamspaceId?: unknown;
  editedWithin?: unknown;
}): PageSearchFilters {
  const filters: PageSearchFilters = {};

  if (raw.createdBy !== undefined) {
    if (typeof raw.createdBy !== 'string' || !isUUID(raw.createdBy)) {
      throw new BadRequestException('createdBy must be a UUID');
    }
    filters.createdBy = raw.createdBy;
  }

  if (raw.teamspaceId !== undefined) {
    if (raw.teamspaceId === PRIVATE_TEAMSPACE_FILTER) {
      filters.teamspaceId = null;
    } else if (typeof raw.teamspaceId === 'string' && isUUID(raw.teamspaceId)) {
      filters.teamspaceId = raw.teamspaceId;
    } else {
      throw new BadRequestException(
        `teamspaceId must be a UUID or "${PRIVATE_TEAMSPACE_FILTER}"`,
      );
    }
  }

  if (raw.editedWithin !== undefined) {
    const days =
      typeof raw.editedWithin === 'string'
        ? EDITED_WITHIN_DAYS[raw.editedWithin]
        : undefined;
    if (!days) {
      throw new BadRequestException('editedWithin must be one of 1d, 7d, 30d');
    }
    filters.editedWithinDays = days;
  }

  return filters;
}
