export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface PageParams {
  page?: number;
  page_size?: number;
  order_by?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ApiError {
  code: string;
  message: string;
  detail?: unknown;
}
