import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { ErrorCode } from '../constants/error-code.constant';
import { HttpExceptionFilter } from './http-exception';

describe('HttpExceptionFilter', () => {
  const reply = jest.fn();
  const filter = new HttpExceptionFilter({
    httpAdapter: { reply, getRequestUrl: () => '/api/v1/test' },
  } as unknown as HttpAdapterHost);
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ headersSent: false }),
      getRequest: () => ({}),
    }),
  } as unknown as ArgumentsHost;

  beforeEach(() => reply.mockClear());

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
