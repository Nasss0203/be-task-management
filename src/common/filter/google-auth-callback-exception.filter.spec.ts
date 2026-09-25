import { type ArgumentsHost } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Response } from 'express';
import { GoogleAuthCallbackExceptionFilter } from './google-auth-callback-exception.filter';

const createArgumentsHost = (response: Response): ArgumentsHost =>
  ({
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  }) as unknown as ArgumentsHost;

describe('GoogleAuthCallbackExceptionFilter', () => {
  it('redirects every callback failure with only a generic error code', () => {
    const redirect = jest.fn();
    const cookie = jest.fn();
    const response = {
      cookie,
      headersSent: false,
      redirect,
    } as unknown as Response;
    const filter = new GoogleAuthCallbackExceptionFilter(
      new ConfigService({
        NODE_ENV: 'production',
        FRONTEND_URL: 'https://app.example.com',
      }),
    );

    filter.catch(
      new Error(
        'access_token=secret&refresh_token=secret&email=user@example.com',
      ),
      createArgumentsHost(response),
    );

    expect(redirect).toHaveBeenCalledWith(
      'https://app.example.com/callback?error=google_auth_failed',
    );
    expect(redirect.mock.calls[0]?.[0]).not.toContain('secret');
    expect(redirect.mock.calls[0]?.[0]).not.toContain('user@example.com');
    expect(cookie).not.toHaveBeenCalled();
  });

  it('does not write another redirect after headers were sent', () => {
    const redirect = jest.fn();
    const response = { headersSent: true, redirect } as unknown as Response;
    const filter = new GoogleAuthCallbackExceptionFilter(new ConfigService());

    filter.catch(new Error('failure'), createArgumentsHost(response));

    expect(redirect).not.toHaveBeenCalled();
  });
});
