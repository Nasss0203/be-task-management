import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_TYPES } from '../interfaces/types';
import { GoogleAuthApplicationImpl } from './google-auth.application';

describe('GoogleAuthApplicationImpl', () => {
  let app: GoogleAuthApplicationImpl;

  const mockService = {
    loginWithGoogle: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleAuthApplicationImpl,
        {
          provide: AUTH_TYPES.services.GoogleAuthService,
          useValue: mockService,
        },
      ],
    }).compile();

    app = module.get<GoogleAuthApplicationImpl>(GoogleAuthApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should authenticate', async () => {
    mockService.loginWithGoogle.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
    const result = await app.loginWithGoogle({ email: 'test@example.com' } as any);
    expect(mockService.loginWithGoogle).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(result).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });
});
