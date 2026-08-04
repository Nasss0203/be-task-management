import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_TYPES } from '../interfaces/types';
import { RegisterAuthApplicationImpl } from './register-auth.application';

describe('RegisterAuthApplicationImpl', () => {
  let app: RegisterAuthApplicationImpl;

  const mockService = {
    register: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterAuthApplicationImpl,
        {
          provide: AUTH_TYPES.services.RegisterAuthService,
          useValue: mockService,
        },
      ],
    }).compile();

    app = module.get<RegisterAuthApplicationImpl>(RegisterAuthApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should register user', async () => {
    mockService.register.mockResolvedValue({
      id: 'u-1',
      email: 'test@test.com',
    });
    const dto = {
      email: 'test@test.com',
      password: 'password',
      full_name: 'Test',
    } as any;
    const result = await app.register(dto);
    expect(mockService.register).toHaveBeenCalledWith(dto);
    expect(result).toEqual({ id: 'u-1', email: 'test@test.com' });
  });
});
