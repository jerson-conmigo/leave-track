/**
 * Canonical error codes for the `{ success: false, error: { code, message } }`
 * envelope (ARCH-LeaveTrack-v1.0 › Error format). Add codes here — never
 * invent ad-hoc strings at call sites.
 */
export const ERROR_STATUS = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
} as const;

export type ErrorCode = keyof typeof ERROR_STATUS;

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;

  constructor(code: ErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = ERROR_STATUS[code];
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
