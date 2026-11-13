import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { ErrorCode } from '../constants/error-code.constant';
import { HttpExceptionFilter } from './http-exception';

describe('HttpExceptionFilter', () => {
  const reply = jest.fn();
  const filter = new HttpExceptionFilter({
    httpAdapter: {
      reply,
      getRequestUrl: () => '/api/v1/test',
      getRequestMethod: () => 'POST',
    },
  } as unknown as HttpAdapterHost);
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ headersSent: false }),
      getRequest: () => ({}),
    }),
  } as unknown as ArgumentsHost;

  const logError = jest.spyOn(Logger.prototype, 'error');

  beforeEach(() => {
    reply.mockClear();
    logError.mockReset().mockImplementation(() => undefined);
  });

  afterAll(() => logError.mockRestore());

  it('logs the stack of an unexpected error and keeps the response generic', () => {
    const error = new Error('database is down');

    filter.catch(error, host);

    expect(logError).toHaveBeenCalledWith(
      'POST /api/v1/test failed with 500',
      error.stack,
    );
    const [, body] = reply.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(body).toMatchObject({
      statusCode: 500,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Internal Server Error',
    });
    expect(JSON.stringify(body)).not.toContain('database is down');
  });

  it('does not log client errors', () => {
    filter.catch(new HttpException('Nope', HttpStatus.BAD_REQUEST), host);

    expect(logError).not.toHaveBeenCalled();
  });

  it('passes error details through to the response body', () => {
    filter.catch(
      new HttpException(
        {
          code: ErrorCode.WORKSPACE_LIMIT_EXCEEDED,
          message: 'Workspace plan limit reached: MAX_MEMBERS',
          details: { feature: 'MAX_MEMBERS', limit: 5, usage: 5 },
        },
        HttpStatus.FORBIDDEN,
      ),
      host,
    );

    expect(reply).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        statusCode: 403,
        code: ErrorCode.WORKSPACE_LIMIT_EXCEEDED,
        details: { feature: 'MAX_MEMBERS', limit: 5, usage: 5 },
      }),
      403,
    );
  });

  it('leaves details out when the exception has none', () => {
    filter.catch(new HttpException('Nope', HttpStatus.BAD_REQUEST), host);

    const [, body] = reply.mock.calls[0] as [unknown, Record<string, unknown>];
    expect(body).not.toHaveProperty('details');
    expect(body.code).toBe(ErrorCode.BAD_REQUEST);
  });
});
