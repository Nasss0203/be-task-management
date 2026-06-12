import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  let service: PermissionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionService],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create', () => {
    expect(service.create({} as any)).toBe('This action adds a new permission');
  });

  it('should findAll', () => {
    expect(service.findAll()).toBe('This action returns all permission');
  });

  it('should findOne', () => {
    expect(service.findOne(1)).toBe('This action returns a #1 permission');
  });

  it('should update', () => {
    expect(service.update(1, {} as any)).toBe('This action updates a #1 permission');
  });

  it('should remove', () => {
    expect(service.remove(1)).toBe('This action removes a #1 permission');
  });
});
