import { ResourceAccessLevel } from './resource-access-level.constant';

const RESOURCE_ACCESS_LEVEL_RANK: Record<ResourceAccessLevel, number> = {
  [ResourceAccessLevel.VIEWER]: 10,
  [ResourceAccessLevel.COMMENTER]: 20,
  [ResourceAccessLevel.EDITOR]: 30,
  [ResourceAccessLevel.FULL_ACCESS]: 40,
};

export function getResourceAccessLevelRank(level: ResourceAccessLevel): number {
  return RESOURCE_ACCESS_LEVEL_RANK[level];
}

export function compareResourceAccessLevel(
  first: ResourceAccessLevel,
  second: ResourceAccessLevel,
): number {
  return getResourceAccessLevelRank(first) - getResourceAccessLevelRank(second);
}

export function isAccessLevelAtLeast(
  currentLevel: ResourceAccessLevel,
  requiredLevel: ResourceAccessLevel,
): boolean {
  return compareResourceAccessLevel(currentLevel, requiredLevel) >= 0;
}

export function canGrantAccessLevel(
  actorLevel: ResourceAccessLevel,
  requestedLevel: ResourceAccessLevel,
): boolean {
  return isAccessLevelAtLeast(actorLevel, requestedLevel);
}

export function getHigherAccessLevel(
  first: ResourceAccessLevel | null | undefined,
  second: ResourceAccessLevel | null | undefined,
): ResourceAccessLevel | null {
  if (!first) {
    return second ?? null;
  }

  if (!second) {
    return first;
  }

  return isAccessLevelAtLeast(first, second) ? first : second;
}

export function getHighestAccessLevel(
  levels: readonly (ResourceAccessLevel | null | undefined)[],
): ResourceAccessLevel | null {
  return levels.reduce<ResourceAccessLevel | null>(
    (highest, current) => getHigherAccessLevel(highest, current),
    null,
  );
}
