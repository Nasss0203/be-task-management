import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_TYPES } from '../interfaces/types';
import { RefreshAuthApplicationImpl } from './refresh-auth.application';

describe('RefreshAuthApplicationImpl', () => {
  let app: RefreshAuthApplicationImpl;

  const mockService = {
    refresh: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshAuthApplicationImpl,
        {
          provide: AUTH_TYPES.services.RefreshAuthService,
          useValue: mockService,
        },
      ],
    }).compile();

    app = module.get<RefreshAuthApplicationImpl>(RefreshAuthApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should refresh token', async () => {
    mockService.refresh.mockResolvedValue({
      accessToken: 'a',
      refreshToken: 'r',
    });
    const result = await app.refresh('old_token');
    expect(mockService.refresh).toHaveBeenCalledWith('old_token');
    expect(result).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });
});
