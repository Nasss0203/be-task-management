import {
  ActivityAction,
  ActivityEntityType,
} from '../../../domain/entities/activity.entity';
import type {
  ActivityResponseDto,
  ActivityTargetResponseDto,
} from '../../dto/response/activity.response.dto';
import type {
  ActivityTargetNames,
  ActivityTargetRequest,
} from '../../ports/page-activity-details.reader.port';

const OPTION_TYPES = new Set(['SELECT', 'STATUS', 'MULTI_SELECT']);

function propertyIdOf(item: ActivityResponseDto): string | null {
  if (item.action === ActivityAction.DATABASE_ROW_UPDATED) return item.field;
  const propertyId = item.metadata?.propertyId;
  return typeof propertyId === 'string' ? propertyId : null;
}

function valueIds(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value))
    return value.filter((id): id is string => typeof id === 'string');
  return [];
}

function hasTarget(item: ActivityResponseDto): boolean {
  return (
    item.entityType === ActivityEntityType.DATABASE ||
    item.entityType === ActivityEntityType.DATABASE_ROW
  );
}

export function activityTargetRequest(
  items: ActivityResponseDto[],
): ActivityTargetRequest {
  const withTarget = items.filter(hasTarget);
  const ids = withTarget.flatMap((item) => valueIds(item.newValue));

  return {
    rowIds: withTarget
      .filter((item) => item.entityType === ActivityEntityType.DATABASE_ROW)
      .map((item) => item.entityId),
    propertyIds: withTarget
      .map(propertyIdOf)
      .filter((id): id is string => id !== null),
    optionIds: ids,
    userIds: ids,
  };
}

export function activityTarget(
  item: ActivityResponseDto,
  names: ActivityTargetNames,
): ActivityTargetResponseDto | null {
  if (!hasTarget(item)) return null;

  const propertyId = propertyIdOf(item);
  const property = propertyId ? names.properties.get(propertyId) : undefined;
  const ids = valueIds(item.newValue);

  return {
    rowTitle:
      item.entityType === ActivityEntityType.DATABASE_ROW
        ? (names.rowTitles.get(item.entityId) ?? null)
        : null,
    propertyName: property?.name ?? null,
    propertyType: property?.type ?? null,
    options:
      property && OPTION_TYPES.has(property.type)
        ? ids.flatMap((id) => {
            const option = names.options.get(id);
            return option ? [{ id, ...option }] : [];
          })
        : [],
    people:
      property?.type === 'PERSON'
        ? ids
            .filter((id) => names.users.has(id))
            .map((id) => ({ id, username: names.users.get(id) ?? null }))
        : [],
  };
}
