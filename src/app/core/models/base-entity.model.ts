/**
 * Base shape every domain entity extends. Timestamps arrive as ISO
 * strings (JSON has no native date type); `deleted_at` is set for
 * soft-deleted rows — the backend filters them out by default so the
 * frontend rarely sees this populated.
 */
export interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Server pagination envelope, matching `app.base.schema.PaginatedResponse`.
 * `total` is the pre-pagination count; drives the paginator's page count.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Query params for list endpoints. Extra keys are allowed so callers
 * can pass filter/search params through without a bespoke type per
 * endpoint (the caller knows what the backend accepts).
 */
export interface PageParams {
  page?: number;
  page_size?: number;
  order_by?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Shape of every error response from the backend, matching
 * `app.base.schema.ErrorResponse`. `code` is stable across releases;
 * UI can branch on it. `message` is human-safe. `detail` is optional
 * (Pydantic validation errors etc.).
 */
export interface ApiError {
  code: string;
  message: string;
  detail?: unknown;
}
