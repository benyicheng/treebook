import type { Response } from 'express';

export type ApiOk<T> = { success: true; data: T; traceId?: string };
export type ApiErr = { success: false; error: { code: string; message: string }; traceId?: string };

export const sendOk = <T>(res: Response, data: T, traceId?: string, status = 200) => {
  const body: ApiOk<T> = { success: true, data, traceId };
  res.status(status).json(body);
};

export const sendErr = (res: Response, code: string, message: string, traceId?: string, status = 400) => {
  const body: ApiErr = { success: false, error: { code, message }, traceId };
  res.status(status).json(body);
};

export class AppError extends Error {
  statusCode: number;
  code: string;
  
  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

