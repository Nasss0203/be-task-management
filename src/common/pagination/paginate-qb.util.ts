import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export interface PaginateQbResult<T> {
  entities: T[];
  raw: Array<Record<string, unknown>>;
  total: number;
}

/**
 * Paginates a TypeORM QueryBuilder in two clean phases:
 *
 * 1. COUNT phase  — uses `baseQb` as-is (WHERE conditions only, no 1-N JOINs)
 *                   so PostgreSQL counts rows without inflating them.
 *
 * 2. DATA phase   — calls `extendForData` to add display JOINs (1-1 relations),
 *                   ORDER BY, LIMIT, and OFFSET, then fetches entities + raw rows.
 *
 * @param baseQb        Query builder with only WHERE/filter conditions applied.
 *                      Must NOT contain 1-N JOINs or ORDER BY.
 * @param extendForData Callback that receives a clone of baseQb and should add
 *                      display JOINs, addSelect(), and orderBy() calls.
 * @param skip          Number of rows to skip (offset).
 * @param take          Number of rows to take (limit).
 */
export async function paginateQb<T extends ObjectLiteral>(
  baseQb: SelectQueryBuilder<T>,
  extendForData: (qb: SelectQueryBuilder<T>) => SelectQueryBuilder<T>,
  skip: number,
  take: number,
): Promise<PaginateQbResult<T>> {
  // Phase 1: COUNT — clone the base query (no display JOINs) for accurate count
  const total = await baseQb.clone().getCount();

  if (total === 0) {
    return { entities: [], raw: [], total: 0 };
  }

  // Phase 2: DATA — extend with display JOINs, ordering, and pagination
  const { entities, raw } = await extendForData(baseQb.clone())
    .skip(skip)
    .take(take)
    .getRawAndEntities();

  return { entities, raw: raw as Array<Record<string, unknown>>, total };
}
