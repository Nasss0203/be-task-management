export interface PaginationInput {
  page?: number | string;
  pageSize?: number | string;
}

export interface NormalizedPagination {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Normalizes raw page/pageSize input (from query strings or filters)
 * into safe, bounded integer values.
 *
 * @param input           Object with optional page and pageSize fields
 * @param defaultPageSize Default page size when not provided (default: 10)
 * @param maxPageSize     Maximum allowed page size (default: 100)
 */
export function normalizePagination(
  input: PaginationInput,
  defaultPageSize = 10,
  maxPageSize = 100,
): NormalizedPagination {
  const rawPage = Number(input.page);
  const rawPageSize = Number(input.pageSize);

  const page = Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1;
  const pageSize = Math.min(
    Number.isInteger(rawPageSize) && rawPageSize >= 1
      ? rawPageSize
      : defaultPageSize,
    maxPageSize,
  );

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

/**
 * Builds the standard pagination metadata object to include in API responses.
 */
export function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): PaginationMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}
