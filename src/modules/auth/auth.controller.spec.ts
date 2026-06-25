import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_TYPES } from './interfaces/types';

import { JwtModule } from '@nestjs/jwt';

describe('AuthController', () => {
  let controller: AuthController;

  const mockLoginApp = { login: jest.fn() };
  const mockRegisterApp = { register: jest.fn() };
  const mockRefreshApp = { refresh: jest.fn() };
  const mockLogoutApp = { logout: jest.fn() };
  const mockGetProfileApp = { getProfile: jest.fn() };
  const mockGoogleApp = { authenticate: jest.fn() };

  beforeEach(async () => {
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
          useValue: { resendVerificationEmail: jest.fn(), verifyEmail: jest.fn(), forgotPassword: jest.fn(), resetPassword: jest.fn() }
        }
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
