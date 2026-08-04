import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorCode } from '../constants/error-code.constant';
import * as fs from 'fs';

type ExceptionResponse = {
  code?: ErrorCode | string;
  error?: string;
  message?: string | string[];
  statusCode?: number;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const response = ctx.getResponse();

    if (response.headersSent) {
      return;
    }

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal Server Error';
    let code: ErrorCode | string = this.getDefaultErrorCode(httpStatus);

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      message =
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as ExceptionResponse).message || message
          : exceptionResponse;

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        code = (exceptionResponse as ExceptionResponse).code || code;
      }
    } else if (exception instanceof Error) {
      code = ErrorCode.INTERNAL_ERROR;
    }

    const responseBody = {
      statusCode: httpStatus,
      code,
      message,
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      timestamp: new Date().toISOString(),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }

  private getDefaultErrorCode(statusCode: number): ErrorCode | string {
    const statusCodeMap: Record<number, ErrorCode> = {
      [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
      [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
      [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
      [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
      [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
      [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.RATE_LIMIT_EXCEEDED,
      [HttpStatus.INTERNAL_SERVER_ERROR]: ErrorCode.INTERNAL_ERROR,
    };

    return (
      statusCodeMap[statusCode] ||
      HttpStatus[statusCode] ||
      ErrorCode.INTERNAL_ERROR
    );
  }
}
