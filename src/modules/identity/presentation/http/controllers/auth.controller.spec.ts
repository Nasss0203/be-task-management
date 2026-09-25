/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from 'src/modules/identity/application/services/auth.service';
import { LoginAuthHandler } from 'src/modules/identity/application/commands/login-auth/login-auth.handler';
import { RegisterAuthHandler } from 'src/modules/identity/application/commands/register-auth/register-auth.handler';
import { RefreshAuthHandler } from 'src/modules/identity/application/commands/refresh-auth/refresh-auth.handler';
import { LogoutAuthHandler } from 'src/modules/identity/application/commands/logout-auth/logout-auth.handler';
import { GetProfileAuthHandler } from 'src/modules/identity/application/queries/get-profile-auth/get-profile-auth.handler';
import { GoogleAuthHandler } from 'src/modules/identity/application/commands/google-auth/google-auth.handler';
import { JwtModule } from '@nestjs/jwt';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import {
  EXCEPTION_FILTERS_METADATA,
  GUARDS_METADATA,
} from '@nestjs/common/constants';
import { GoogleAuthCallbackGuard } from 'src/common/guard/google-auth-callback.guard';
import { GoogleAuthInitiationGuard } from 'src/common/guard/google-auth-initiation.guard';
import { RefreshTokenOriginGuard } from 'src/common/guard/refresh-token-origin.guard';
import { GoogleOAuthStateService } from 'src/common/services/google-oauth-state.service';
import { GoogleAuthCallbackExceptionFilter } from 'src/common/filter/google-auth-callback-exception.filter';
import {
  REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
  REFRESH_TOKEN_COOKIE_PATH,
} from 'src/common/constants/refresh-token-cookie.constant';

describe('AuthController', () => {
  let controller: AuthController;

  const mockLoginHandler = { execute: jest.fn() };
  const mockRegisterHandler = { execute: jest.fn() };
  const mockRefreshHandler = { execute: jest.fn() };
  const mockLogoutHandler = { execute: jest.fn() };
  const mockGetProfileHandler = { execute: jest.fn() };
  const mockGoogleHandler = { execute: jest.fn() };
  const mockAuthService = {
    resendVerificationEmail: jest.fn(),
    verifyEmail: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    activateAdmin: jest.fn(),
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test',
          signOptions: { expiresIn: '60s' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: LoginAuthHandler,
          useValue: mockLoginHandler,
        },
        {
          provide: RegisterAuthHandler,
          useValue: mockRegisterHandler,
        },
        {
          provide: RefreshAuthHandler,
          useValue: mockRefreshHandler,
        },
        {
          provide: LogoutAuthHandler,
          useValue: mockLogoutHandler,
        },
        {
          provide: GetProfileAuthHandler,
          useValue: mockGetProfileHandler,
        },
        {
          provide: GoogleAuthHandler,
          useValue: mockGoogleHandler,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        GoogleOAuthStateService,
        GoogleAuthInitiationGuard,
        GoogleAuthCallbackGuard,
        RefreshTokenOriginGuard,
        GoogleAuthCallbackExceptionFilter,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const values: Record<string, string> = {
                NODE_ENV: 'production',
                FRONTEND_URL: 'https://app.example.com',
                CLIENT_URL: 'https://app.example.com',
                ADMIN_CLIENT_URL: 'https://admin.example.com',
              };

              return values[key];
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('uses separate Google initiation and callback guards', () => {
    const initiationGuards = Reflect.getMetadata(
      GUARDS_METADATA,
      AuthController.prototype.googleAuth,
    ) as unknown[];
    const callbackGuards = Reflect.getMetadata(
      GUARDS_METADATA,
      AuthController.prototype.googleAuthCallback,
    ) as unknown[];

    expect(initiationGuards).toContain(GoogleAuthInitiationGuard);
    expect(callbackGuards).toContain(GoogleAuthCallbackGuard);
  });

  it('protects refresh/logout origins and filters Google callback errors', () => {
    const refreshGuards = Reflect.getMetadata(
      GUARDS_METADATA,
      AuthController.prototype.refresh,
    ) as unknown[];
    const logoutGuards = Reflect.getMetadata(
      GUARDS_METADATA,
      AuthController.prototype.logout,
    ) as unknown[];
    const callbackFilters = Reflect.getMetadata(
      EXCEPTION_FILTERS_METADATA,
      AuthController.prototype.googleAuthCallback,
    ) as unknown[];

    expect(refreshGuards).toContain(RefreshTokenOriginGuard);
    expect(logoutGuards).toContain(RefreshTokenOriginGuard);
    expect(callbackFilters).toContain(GoogleAuthCallbackExceptionFilter);
  });

  it('sets the refresh cookie on login without serializing it', async () => {
    mockLoginHandler.execute.mockResolvedValue({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });

    const result = await controller.login(
      { email: 'user@example.com', password: 'password' },
      { id: 'user-id' } as never,
      mockResponse,
    );

    expect(result).toEqual({ access_token: 'access-token' });
    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh-token',
      {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: REFRESH_TOKEN_COOKIE_PATH,
        maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_MS,
      },
    );
  });

  describe('refresh', () => {
    beforeEach(() => {
      mockRefreshHandler.execute.mockResolvedValue({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      });
    });

    it('prefers the cookie, rotates it, and returns only the access token', async () => {
      const result = await controller.refresh(
        { cookies: { refresh_token: 'cookie-token' } } as never,
        { refresh_token: 'body-token' },
        mockResponse,
      );

      expect(mockRefreshHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({ refreshToken: 'cookie-token' }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'new-refresh-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: REFRESH_TOKEN_COOKIE_PATH,
        }),
      );
      expect(result).toEqual({ access_token: 'new-access-token' });
    });

    it('keeps the body token as a compatibility fallback', async () => {
      await controller.refresh(
        { cookies: {} } as never,
        { refresh_token: 'body-token' },
        mockResponse,
      );

      expect(mockRefreshHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({ refreshToken: 'body-token' }),
      );
    });
  });

  it('revokes the cookie token and clears the backend cookie on logout', async () => {
    mockLogoutHandler.execute.mockResolvedValue({ success: true });

    const result = await controller.logout(
      { cookies: { refresh_token: 'cookie-token' } } as never,
      { refresh_token: 'body-token' },
      mockResponse,
    );

    expect(mockLogoutHandler.execute).toHaveBeenCalledWith(
      expect.objectContaining({ refreshToken: 'cookie-token' }),
    );
    expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: REFRESH_TOKEN_COOKIE_PATH,
    });
    expect(result).toEqual({ success: true });
  });

  it('still clears the backend cookie when logout revocation fails', async () => {
    mockLogoutHandler.execute.mockRejectedValue(new Error('persistence error'));

    await expect(
      controller.logout(
        { cookies: { refresh_token: 'cookie-token' } } as never,
        {},
        mockResponse,
      ),
    ).rejects.toThrow('persistence error');

    expect(mockResponse.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({
        sameSite: 'lax',
        path: REFRESH_TOKEN_COOKIE_PATH,
      }),
    );
  });

  it('sets the refresh cookie and performs a clean Google callback redirect', async () => {
    mockGoogleHandler.execute.mockResolvedValue({
      access_token: 'sensitive-access-token',
      refresh_token: 'sensitive-refresh-token',
      user: { id: 'user-id', email: 'user@example.com' },
    });

    await controller.googleAuthCallback(
      {
        subject: 'google-subject',
        email: 'user@example.com',
        emailVerified: true,
      },
      mockResponse,
    );

    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'sensitive-refresh-token',
      expect.objectContaining({ httpOnly: true, sameSite: 'lax' }),
    );
    expect(mockResponse.redirect).toHaveBeenCalledWith(
      'https://app.example.com/callback',
    );
    const redirectUrl = mockResponse.redirect.mock.calls[0]?.[0] as string;
    expect(redirectUrl).not.toContain('access_token');
    expect(redirectUrl).not.toContain('refresh_token');
    expect(redirectUrl).not.toContain('user@example.com');
  });

  describe('verifyEmail', () => {
    it('should call verifyEmail on service, set cookie, and return result when successful with tokens', async () => {
      const dto = { token: 'valid-token' };
      const serviceResult = {
        success: true,
        access_token: 'mock-access',
        refresh_token: 'mock-refresh',
      };
      mockAuthService.verifyEmail.mockResolvedValue(serviceResult);

      const result = await controller.verifyEmail(dto, mockResponse);

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('valid-token');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'mock-refresh',
        expect.objectContaining({
          httpOnly: true,
          path: '/api/v1/auth',
        }),
      );
      expect(result).toEqual({
        success: true,
        access_token: 'mock-access',
      });
    });
  });

  it('sets the cookie after admin activation without returning refresh token', async () => {
    mockAuthService.activateAdmin.mockResolvedValue({
      success: true,
      access_token: 'admin-access-token',
      refresh_token: 'admin-refresh-token',
    });

    const result = await controller.activateAdmin(
      { token: 'activation-token', password: 'password' },
      mockResponse,
    );

    expect(mockResponse.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'admin-refresh-token',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(result).toEqual({
      success: true,
      access_token: 'admin-access-token',
    });
  });
});
