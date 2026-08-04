import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_TYPES } from '../interfaces/types';
import { LoginAuthApplicationImpl } from './login-auth.application';

describe('LoginAuthApplicationImpl', () => {
  let app: LoginAuthApplicationImpl;

  const mockService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginAuthApplicationImpl,
        {
          provide: AUTH_TYPES.services.LoginAuthService,
          useValue: mockService,
        },
      ],
    }).compile();

    app = module.get<LoginAuthApplicationImpl>(LoginAuthApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should login', async () => {
    mockService.login.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
    });
    const auth = { email: 'test@example.com', password: 'password' } as any;
    const result = await app.login(auth);
    expect(mockService.login).toHaveBeenCalledWith(auth);
    expect(result).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });
});
