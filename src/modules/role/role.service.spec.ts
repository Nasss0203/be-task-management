import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';

describe('RoleService', () => {
  let service: RoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RoleService],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create', () => {
    expect(service.create({} as any)).toBe('This action adds a new role');
  });

  it('should findAll', () => {
    expect(service.findAll()).toBe('This action returns all role');
  });

  it('should findOne', () => {
    expect(service.findOne(1)).toBe('This action returns a #1 role');
  });

  it('should update', () => {
    expect(service.update(1, {} as any)).toBe('This action updates a #1 role');
  });

  it('should remove', () => {
    expect(service.remove(1)).toBe('This action removes a #1 role');
  });
});
