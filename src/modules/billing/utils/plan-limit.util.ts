import {
  DEFAULT_PLAN_LIMITS,
  FREE_PLAN_SLUG,
} from '../constants/default-plan-limits.constant';
import { Plan } from '../domain/entities/plan.entity';

export function mergePlanLimits(
  plan: Pick<Plan, 'slug' | 'limits'> | null,
): Record<string, unknown> {
  if (!plan) {
    return DEFAULT_PLAN_LIMITS[FREE_PLAN_SLUG];
  }

  const defaultLimits = DEFAULT_PLAN_LIMITS[plan.slug] ?? {};
  const customLimits = plan.limits ?? {};

  return {
    ...defaultLimits,
    ...customLimits,
  };
}

export function getNumberLimit(
  limits: Record<string, unknown> | null,
  key: string,
  defaultValue: number,
): number {
  const value = limits?.[key];

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return defaultValue;
}

export function getNullableNumberLimit(
  limits: Record<string, unknown>,
  key: string,
): number | null | undefined {
  const value = limits[key];

  if (value === null) {
    return null;
  }

  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return undefined;
}
