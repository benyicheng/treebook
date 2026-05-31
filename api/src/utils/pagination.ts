/**
 * 分页工具函数
 *
 * 统一的 page/limit 分页模式，与 notifications、discover 端点保持一致。
 *
 * 响应格式:
 * {
 *   items: T[],
 *   total: number,
 *   page: number,
 *   limit: number,
 *   totalPages: number
 * }
 */

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

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * 从 query string 解析 page/limit 参数
 */
export function parsePagination(query: {
  page?: string | number;
  limit?: string | number;
}): PaginationParams {
  let page = Number(query.page) || DEFAULT_PAGE;
  let limit = Number(query.limit) || DEFAULT_LIMIT;

  if (page < 1) page = 1;
  if (limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  return { page, limit };
}

/**
 * 组装分页响应
 */
export function paginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResponse<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
