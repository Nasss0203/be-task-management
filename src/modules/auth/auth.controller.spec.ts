import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_TYPES } from './interfaces/types';
import { JwtModule } from '@nestjs/jwt';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockLoginApp = { login: jest.fn() };
  const mockRegisterApp = { register: jest.fn() };
  const mockRefreshApp = { refresh: jest.fn() };
  const mockLogoutApp = { logout: jest.fn() };
  const mockGetProfileApp = { getProfile: jest.fn() };
  const mockGoogleApp = { authenticate: jest.fn() };
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
        JwtModule.register({ secret: 'test', signOptions: { expiresIn: '60s' } })
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AUTH_TYPES.applications.LoginAuthApplication,
          useValue: mockLoginApp,
        },
        {
          provide: AUTH_TYPES.applications.RegisterAuthApplication,
          useValue: mockRegisterApp,
        },
        {
          provide: AUTH_TYPES.applications.RefreshAuthApplication,
          useValue: mockRefreshApp,
        },
        {
          provide: AUTH_TYPES.applications.LogoutAuthApplication,
          useValue: mockLogoutApp,
        },
        {
          provide: AUTH_TYPES.applications.GetProfileAuthApplication,
          useValue: mockGetProfileApp,
        },
        {
          provide: AUTH_TYPES.applications.GoogleAuthApplication,
          useValue: mockGoogleApp,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        }
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
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
