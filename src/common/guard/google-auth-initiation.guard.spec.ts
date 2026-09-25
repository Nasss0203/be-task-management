import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Response } from 'express';
import {
  GOOGLE_OAUTH_STATE_BYTE_LENGTH,
  GOOGLE_OAUTH_STATE_COOKIE_MAX_AGE_MS,
  GOOGLE_OAUTH_STATE_COOKIE_NAME,
  GOOGLE_OAUTH_STATE_COOKIE_PATH,
} from 'src/common/constants/google-oauth-state.constant';
import { GoogleOAuthStateService } from 'src/common/services/google-oauth-state.service';
import { GoogleAuthInitiationGuard } from './google-auth-initiation.guard';

const createExecutionContext = (response: Response): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  }) as unknown as ExecutionContext;

describe('GoogleAuthInitiationGuard', () => {
  it.each([
    ['production', true],
    ['development', false],
  ])(
    'sets the state cookie and authenticate option in %s',
    (nodeEnv, expectedSecure) => {
      const cookie = jest.fn();
      const response = { cookie } as unknown as Response;
      const context = createExecutionContext(response);
      const guard = new GoogleAuthInitiationGuard(
        new GoogleOAuthStateService(),
        new ConfigService({ NODE_ENV: nodeEnv }),
      );

      const options = guard.getAuthenticateOptions(context) as {
        state?: unknown;
      };

      expect(typeof options.state).toBe('string');
      expect(Buffer.from(options.state as string, 'base64url')).toHaveLength(
        GOOGLE_OAUTH_STATE_BYTE_LENGTH,
      );
      expect(cookie).toHaveBeenCalledWith(
        GOOGLE_OAUTH_STATE_COOKIE_NAME,
        options.state,
        {
          httpOnly: true,
          secure: expectedSecure,
          sameSite: 'lax',
          path: GOOGLE_OAUTH_STATE_COOKIE_PATH,
          maxAge: GOOGLE_OAUTH_STATE_COOKIE_MAX_AGE_MS,
        },
      );
    },
  );
});
