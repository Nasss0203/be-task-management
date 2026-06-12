import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AUTH_TYPES } from './interfaces/types';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AUTH_TYPES.applications.RegisterAuthApplication, useValue: {} },
        { provide: AUTH_TYPES.applications.LoginAuthApplication, useValue: {} },
        { provide: AUTH_TYPES.applications.RefreshAuthApplication, useValue: {} },
        { provide: AUTH_TYPES.applications.LogoutAuthApplication, useValue: {} },
        { provide: AUTH_TYPES.applications.GetProfileAuthApplication, useValue: {} },
        { provide: AUTH_TYPES.services.ValidateUserAuthService, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
