import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create', () => {
    expect(service.create({} as any)).toBe('This action adds a new user');
  });

  it('should findAll', () => {
    expect(service.findAll()).toBe('This action returns all users');
  });

  it('should findOne', () => {
    expect(service.findOne(1)).toBe('This action returns a #1 user');
  });

  it('should update', () => {
    expect(service.update(1, {} as any)).toBe('This action updates a #1 user');
  });

  it('should remove', () => {
    expect(service.remove(1)).toBe('This action removes a #1 user');
  });
});
