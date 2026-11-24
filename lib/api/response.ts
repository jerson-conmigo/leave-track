import { NextResponse } from "next/server";
import { AppError, ERROR_STATUS, type ErrorCode } from "@/lib/api/errors";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: { code: ErrorCode; message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** 2xx response in the standard envelope. */
export function ok<T>(data: T, init?: ResponseInit): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status: 200, ...init });
}

/** Non-2xx response in the standard envelope. */
export function fail(error: AppError): NextResponse<ApiFailure>;
export function fail(code: ErrorCode, message: string): NextResponse<ApiFailure>;
export function fail(
  errorOrCode: AppError | ErrorCode,
  message?: string,
): NextResponse<ApiFailure> {
  const code = errorOrCode instanceof AppError ? errorOrCode.code : errorOrCode;
  const msg = errorOrCode instanceof AppError ? errorOrCode.message : (message ?? "");
  return NextResponse.json(
    { success: false, error: { code, message: msg } },
    { status: ERROR_STATUS[code] },
  );
}
