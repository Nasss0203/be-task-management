import { Test, TestingModule } from '@nestjs/testing';
import { FeatureSeedService } from './feature.seed.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Feature } from '../features/domain/entities/feature.entity';
import { Plan } from '../billing/domain/entities/plan.entity';
import { PlanFeature } from '../plan_features/domain/entities/plan_feature.entity';

describe('FeatureSeedService', () => {
  let service: FeatureSeedService;
  const mockFeatureQueryBuilder = {
    withDeleted: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };
  const mockFeatureRepo = {
    createQueryBuilder: jest.fn().mockReturnValue(mockFeatureQueryBuilder),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockPlanRepo = { find: jest.fn() };
  const mockPlanFeatureRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureSeedService,
        { provide: getRepositoryToken(Feature), useValue: mockFeatureRepo },
        { provide: getRepositoryToken(Plan), useValue: mockPlanRepo },
        {
          provide: getRepositoryToken(PlanFeature),
          useValue: mockPlanFeatureRepo,
        },
      ],
    }).compile();

    service = module.get<FeatureSeedService>(FeatureSeedService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should seed features and plan features', async () => {
    mockFeatureQueryBuilder.getOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    mockFeatureRepo.create.mockImplementation((item) => item);
    mockFeatureRepo.save.mockImplementation(async (item) => ({
      ...item,
      id: 'f1',
    }));

    mockPlanRepo.find.mockResolvedValue([
      { id: 'p1', features: { sprint_enabled: true } },
    ]);

    mockPlanFeatureRepo.findOne.mockResolvedValue(null);
    mockPlanFeatureRepo.create.mockImplementation((item) => item);
    mockPlanFeatureRepo.save.mockResolvedValue({});

    await service.seed();

    expect(mockFeatureRepo.create).toHaveBeenCalled();
    expect(mockPlanRepo.find).toHaveBeenCalled();
    expect(mockPlanFeatureRepo.create).toHaveBeenCalled();
  });

  it('should seed features - update existed exact feature', async () => {
    mockFeatureQueryBuilder.getOne.mockResolvedValueOnce({ id: 'f1' });
    mockFeatureRepo.save.mockImplementation(async (item) => item);

    mockPlanRepo.find.mockResolvedValue([
      { id: 'p1', features: { sprint_enabled: true } },
    ]);
    mockPlanFeatureRepo.findOne.mockResolvedValue({ id: 'pf1' });

    await service.seed();

    expect(mockFeatureRepo.create).not.toHaveBeenCalled();
    expect(mockPlanFeatureRepo.create).not.toHaveBeenCalled();
    expect(mockPlanFeatureRepo.save).toHaveBeenCalled();
  });

  it('should seed features - update existed legacy feature', async () => {
    mockFeatureQueryBuilder.getOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'f1' });
    mockFeatureRepo.save.mockImplementation(async (item) => item);

    mockPlanRepo.find.mockResolvedValue([]);

    await service.seed();

    expect(mockFeatureRepo.create).not.toHaveBeenCalled();
  });
});
