import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { InternalTemplateRenderGuard } from './internal-template-render.guard';

describe('InternalTemplateRenderGuard', () => {
  const secret = '12345678901234567890123456789012';

  function createContext(header?: string | string[]): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {
            ...(header !== undefined
              ? { 'x-template-render-key': header }
              : {}),
          },
        }),
      }),
    } as unknown as ExecutionContext;
  }

  // null (not undefined) means "not configured": undefined would fall back to the default.
  function createGuard(configuredSecret: string | null = secret) {
    const configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key !== 'TEMPLATE_RENDER_INTERNAL_KEY') {
          throw new Error(`Unexpected config key: ${key}`);
        }

        if (configuredSecret === null) {
          throw new Error(
            'Configuration key "TEMPLATE_RENDER_INTERNAL_KEY" does not exist',
          );
        }

        return configuredSecret;
      }),
    } as unknown as ConfigService;

    return new InternalTemplateRenderGuard(configService);
  }

  it('rejects a missing key', () => {
    const guard = createGuard();

    expect(() => guard.canActivate(createContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an empty key', () => {
    const guard = createGuard();

    expect(() => guard.canActivate(createContext(''))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a wrong key with different length', () => {
    const guard = createGuard();

    expect(() => guard.canActivate(createContext('wrong'))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a wrong key with the same length', () => {
    const guard = createGuard();

    const wrong = 'abcdefghijklmnopqrstuvwxyz123456';

    expect(() => guard.canActivate(createContext(wrong))).toThrow(
      UnauthorizedException,
    );
  });

  it('allows the correct key', () => {
    const guard = createGuard();

    expect(guard.canActivate(createContext(secret))).toBe(true);
  });

  it('fails when server configuration is missing', () => {
    const guard = createGuard(null);

    expect(() => guard.canActivate(createContext(secret))).toThrow(
      'does not exist',
    );
  });

  it('fails closed when the configured key is empty', () => {
    const guard = createGuard('');

    expect(() => guard.canActivate(createContext(secret))).toThrow(
      'must not be empty',
    );
  });
});
