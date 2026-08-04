import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_TYPES } from '../interfaces/types';
import { GetProfileAuthApplicationImpl } from './get-profile-auth.application';

describe('GetProfileAuthApplicationImpl', () => {
  let app: GetProfileAuthApplicationImpl;

  const mockService = {
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProfileAuthApplicationImpl,
        {
          provide: AUTH_TYPES.services.GetProfileAuthService,
          useValue: mockService,
        },
      ],
    }).compile();

    app = module.get<GetProfileAuthApplicationImpl>(
      GetProfileAuthApplicationImpl,
    );
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should get profile', async () => {
    mockService.getProfile.mockResolvedValue({ id: 'u-1' });
    const result = await app.getProfile('u-1');
    expect(mockService.getProfile).toHaveBeenCalledWith('u-1');
    expect(result).toEqual({ id: 'u-1' });
  });
});
