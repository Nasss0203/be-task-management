import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_TYPES } from '../interfaces/types';
import { LogoutAuthApplicationImpl } from './logout-auth.application';

describe('LogoutAuthApplicationImpl', () => {
  let app: LogoutAuthApplicationImpl;

  const mockService = {
    logout: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutAuthApplicationImpl,
        {
          provide: AUTH_TYPES.services.LogoutAuthService,
          useValue: mockService,
        },
      ],
    }).compile();

    app = module.get<LogoutAuthApplicationImpl>(LogoutAuthApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should logout', async () => {
    mockService.logout.mockResolvedValue({ success: true });
    const result = await app.logout('token');
    expect(mockService.logout).toHaveBeenCalledWith('token');
    expect(result).toEqual({ success: true });
  });
});
