import { Test, TestingModule } from '@nestjs/testing';
import { RbacSeedService } from './rbac.seed.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Permission } from '../permission/domain/entities/permission.entity';
import { Role } from '../role/domain/entities/role.entity';
import { RolePermission } from '../role_permission/domain/entities/role_permission.entity';
import { Workspace } from '../workspaces/domain/entities/workspace.entity';

describe('RbacSeedService', () => {
  let service: RbacSeedService;
  const mockPermissionRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };
  const mockRoleRepo = { find: jest.fn(), create: jest.fn(), save: jest.fn() };
  const mockRolePermissionRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };
  const mockWorkspaceRepo = { find: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacSeedService,
        {
          provide: getRepositoryToken(Permission),
          useValue: mockPermissionRepo,
        },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepo },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: mockRolePermissionRepo,
        },
        { provide: getRepositoryToken(Workspace), useValue: mockWorkspaceRepo },
      ],
    }).compile();

    service = module.get<RbacSeedService>(RbacSeedService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should seed completely', async () => {
    mockPermissionRepo.findOne.mockResolvedValue(null);
    mockPermissionRepo.create.mockImplementation((item) => item);
    mockPermissionRepo.save.mockResolvedValue({});
    mockPermissionRepo.find.mockResolvedValue([
      { id: 'p1', code: 'workspace.read' },
    ]);
    mockWorkspaceRepo.find.mockResolvedValue([{ id: 'ws1' }]);

    mockRoleRepo.find.mockResolvedValue([]);
    mockRoleRepo.create.mockImplementation((item) => item);
    mockRoleRepo.save.mockImplementation(async (item) => ({
      ...item,
      id: `r-${item.name}`,
    }));

    mockRolePermissionRepo.find.mockResolvedValue([{ permission_id: 'p2' }]);
    mockRolePermissionRepo.findOne.mockResolvedValue(null);
    mockRolePermissionRepo.create.mockImplementation((item) => item);
    mockRolePermissionRepo.save.mockResolvedValue({});
    mockRolePermissionRepo.delete.mockResolvedValue({});

    await service.seed();

    expect(mockPermissionRepo.create).toHaveBeenCalled();
    expect(mockRoleRepo.create).toHaveBeenCalled();
    expect(mockRolePermissionRepo.delete).toHaveBeenCalled();
  });

  it('should seed existing permission and existing role permission', async () => {
    mockPermissionRepo.findOne.mockResolvedValue({ id: 'p1' });

    mockPermissionRepo.find.mockResolvedValue([
      { id: 'p1', code: 'workspace.read' },
    ]);
    mockWorkspaceRepo.find.mockResolvedValue([{ id: 'ws1' }]);
    mockRoleRepo.find.mockResolvedValue([
      { id: 'r1', name: 'ADMIN' },
      { id: 'r2', name: 'MEMBER' },
      { id: 'r3', name: 'GUEST' },
      { id: 'r4', name: 'SYSTEM_ADMIN' },
      { id: 'r5', name: 'SUPER_ADMIN' },
      { id: 'r6', name: 'OWNER' },
      { id: 'r7', name: 'VIEWER' },
    ]);
    mockRolePermissionRepo.find.mockResolvedValue([{ permission_id: 'p1' }]);
    mockRolePermissionRepo.findOne.mockResolvedValue({ id: 'rp1' });

    await service.seed();

    expect(mockPermissionRepo.create).not.toHaveBeenCalled();
    expect(mockRoleRepo.create).not.toHaveBeenCalled();
    expect(mockRolePermissionRepo.delete).not.toHaveBeenCalled();
  });
});
