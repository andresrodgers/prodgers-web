export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T): ApiSuccess<T> {
  return { ok: true, data };
}

export function fail(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ApiFailure {
  return { ok: false, error: { code, message, details } };
}
