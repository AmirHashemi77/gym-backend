import { PaginationQueryDto } from '../dto/pagination-query.dto';

export function getPagination(query: PaginationQueryDto): { skip: number; take: number } {
  return {
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  };
}

export function getPaginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
