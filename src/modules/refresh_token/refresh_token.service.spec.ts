import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenService } from './refresh_token.service';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RefreshTokenService],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create', () => {
    expect(service.create({} as any)).toBe(
      'This action adds a new refreshToken',
    );
  });

  it('should findAll', () => {
    expect(service.findAll()).toBe('This action returns all refreshToken');
  });

  it('should findOne', () => {
    expect(service.findOne(1)).toBe('This action returns a #1 refreshToken');
  });

  it('should update', () => {
    expect(service.update(1, {} as any)).toBe(
      'This action updates a #1 refreshToken',
    );
  });

  it('should remove', () => {
    expect(service.remove(1)).toBe('This action removes a #1 refreshToken');
  });
});
