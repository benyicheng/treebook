import type { ParsedQs } from 'qs';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Safely extract a string value from Express's ParsedQs. */
export function qsVal(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === 'string' ? first : undefined;
  }
  return undefined;
}

/** Safely extract a number value from Express's ParsedQs. */
export function qsNum(value: ParsedQs[string], def: number): number {
  const s = qsVal(value);
  if (s === undefined) return def;
  const n = Number(s);
  return isNaN(n) ? def : n;
}

/** Flatten query params to a plain string record. */
export function qsFlat(query: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) {
    const v = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : undefined;
    if (v !== undefined && typeof v === 'string') result[key] = v;
  }
  return result;
}

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  let page = Number(query.page) || DEFAULT_PAGE;
  let limit = Number(query.limit) || DEFAULT_LIMIT;
  if (page < 1) page = 1;
  if (limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;
  return { page, limit };
}

export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

/**
 * 游标分页辅助函数。
 * 用法：query.take = limit + 1 + cursor/skip 后，将 findMany 结果传入此函数。
 */
export function cursorPaginate<T extends { id: string }>(
  results: T[],
  limit: number,
): CursorPage<T> {
  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, limit) : results;
  return { data, nextCursor: hasMore ? data[data.length - 1].id : null };
}
