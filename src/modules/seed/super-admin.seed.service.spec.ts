import { Test, TestingModule } from '@nestjs/testing';
import { SuperAdminSeedService } from './super-admin.seed.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, SystemRole } from '../users/domain/entities/user.entity';
import { ConfigService } from '@nestjs/config';

describe('SuperAdminSeedService', () => {
  let service: SuperAdminSeedService;
  let configService: jest.Mocked<ConfigService>;
  const mockUserRepo = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };

  beforeEach(async () => {
    const mockConfigService = { get: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminSeedService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SuperAdminSeedService>(SuperAdminSeedService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should seed super admin - new', async () => {
    configService.get.mockImplementation((key) => {
      if (key === 'SUPER_ADMIN_EMAIL') return 'admin@test.com';
      if (key === 'SUPER_ADMIN_USERNAME') return 'admin';
      if (key === 'SUPER_ADMIN_PASSWORD') return 'pass';
      return null;
    });

    mockUserRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    mockUserRepo.create.mockImplementation((item) => item);
    mockUserRepo.save.mockResolvedValue({});

    await service.seed();

    expect(mockUserRepo.create).toHaveBeenCalled();
  });

  it('should update existing super admin', async () => {
    configService.get.mockImplementation((key) => {
      if (key === 'SUPER_ADMIN_EMAIL') return 'admin@test.com';
      if (key === 'SUPER_ADMIN_PASSWORD') return 'pass';
      return null;
    });

    mockUserRepo.findOne.mockResolvedValue({ id: '1', systemRole: SystemRole.USER, isActive: false, passwordHash: null });
    mockUserRepo.save.mockResolvedValue({});

    await service.seed();

    expect(mockUserRepo.save).toHaveBeenCalled();
  });

  it('should not update existing super admin if not needed', async () => {
    configService.get.mockImplementation((key) => {
      if (key === 'SUPER_ADMIN_EMAIL') return 'admin@test.com';
      return null;
    });

    mockUserRepo.findOne.mockResolvedValue({ id: '1', systemRole: SystemRole.SUPER_ADMIN, isActive: true, passwordHash: 'hash' });

    await service.seed();

    expect(mockUserRepo.save).not.toHaveBeenCalled();
  });

  it('should throw error if missing email config', async () => {
    configService.get.mockReturnValue(null);
    await expect(service.seed()).rejects.toThrow('SUPER_ADMIN_EMAIL is required');
  });

  it('should throw error if username is used', async () => {
    configService.get.mockImplementation((key) => {
      if (key === 'SUPER_ADMIN_EMAIL') return 'admin@test.com';
      if (key === 'SUPER_ADMIN_USERNAME') return 'admin';
      if (key === 'SUPER_ADMIN_PASSWORD') return 'pass';
      return null;
    });

    mockUserRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: '2' });

    await expect(service.seed()).rejects.toThrow('SUPER_ADMIN_USERNAME is already used: admin');
  });

  it('should throw error if username missing', async () => {
    configService.get.mockImplementation((key) => {
      if (key === 'SUPER_ADMIN_EMAIL') return 'admin@test.com';
      if (key === 'SUPER_ADMIN_PASSWORD') return 'pass';
      return null;
    });

    mockUserRepo.findOne.mockResolvedValueOnce(null);

    await expect(service.seed()).rejects.toThrow('SUPER_ADMIN_USERNAME is required to create super admin');
  });

  it('should throw error if password missing', async () => {
    configService.get.mockImplementation((key) => {
      if (key === 'SUPER_ADMIN_EMAIL') return 'admin@test.com';
      if (key === 'SUPER_ADMIN_USERNAME') return 'admin';
      return null;
    });

    mockUserRepo.findOne.mockResolvedValueOnce(null);

    await expect(service.seed()).rejects.toThrow('SUPER_ADMIN_PASSWORD is required to create super admin');
  });
});
