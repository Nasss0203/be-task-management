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
  };

  const mockResponse = {
    cookie: jest.fn(),
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
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
      expect(result).toEqual(serviceResult);
    });

    it('should not set cookie if refresh_token is not returned', async () => {
      const dto = { token: 'valid-token' };
      const serviceResult = {
        success: true,
      };
      mockAuthService.verifyEmail.mockResolvedValue(serviceResult);

      const result = await controller.verifyEmail(dto, mockResponse);

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('valid-token');
      expect(mockResponse.cookie).not.toHaveBeenCalled();
      expect(result).toEqual(serviceResult);
    });
  });
});
