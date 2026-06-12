import { Test, TestingModule } from '@nestjs/testing';
import { RolePermissionService } from './role_permission.service';

describe('RolePermissionService', () => {
  let service: RolePermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolePermissionService],
    }).compile();

    service = module.get<RolePermissionService>(RolePermissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create', () => {
    expect(service.create({} as any)).toBe('This action adds a new rolePermission');
  });

  it('should findAll', () => {
    expect(service.findAll()).toBe('This action returns all rolePermission');
  });

  it('should findOne', () => {
    expect(service.findOne(1)).toBe('This action returns a #1 rolePermission');
  });

  it('should update', () => {
    expect(service.update(1, {} as any)).toBe('This action updates a #1 rolePermission');
  });

  it('should remove', () => {
    expect(service.remove(1)).toBe('This action removes a #1 rolePermission');
  });
});
