import { Test, TestingModule } from '@nestjs/testing';
import { UserRolesService } from './user_roles.service';

describe('UserRolesService', () => {
  let service: UserRolesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserRolesService],
    }).compile();

    service = module.get<UserRolesService>(UserRolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create', () => {
    expect(service.create({} as any)).toBe('This action adds a new userRole');
  });

  it('should findAll', () => {
    expect(service.findAll()).toBe('This action returns all userRoles');
  });

  it('should findOne', () => {
    expect(service.findOne(1)).toBe('This action returns a #1 userRole');
  });

  it('should update', () => {
    expect(service.update(1, {} as any)).toBe(
      'This action updates a #1 userRole',
    );
  });

  it('should remove', () => {
    expect(service.remove(1)).toBe('This action removes a #1 userRole');
  });
});
