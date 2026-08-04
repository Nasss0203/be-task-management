import { Test, TestingModule } from '@nestjs/testing';
import { BillingPlanSeedService } from './billing-plan.seed.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Plan } from '../billing/domain/entities/plan.entity';

describe('BillingPlanSeedService', () => {
  let service: BillingPlanSeedService;
  const mockPlanRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingPlanSeedService,
        { provide: getRepositoryToken(Plan), useValue: mockPlanRepo },
      ],
    }).compile();

    service = module.get<BillingPlanSeedService>(BillingPlanSeedService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should seed plans - create new', async () => {
    mockPlanRepo.findOne.mockResolvedValue(null);
    mockPlanRepo.create.mockImplementation((item) => item);
    mockPlanRepo.save.mockResolvedValue({});

    await service.seed();

    expect(mockPlanRepo.findOne).toHaveBeenCalled();
    expect(mockPlanRepo.create).toHaveBeenCalled();
    expect(mockPlanRepo.save).toHaveBeenCalled();
  });

  it('should seed plans - update existed', async () => {
    mockPlanRepo.findOne.mockResolvedValue({ id: '1' });
    mockPlanRepo.save.mockResolvedValue({});

    await service.seed();

    expect(mockPlanRepo.findOne).toHaveBeenCalled();
    expect(mockPlanRepo.create).not.toHaveBeenCalled();
    expect(mockPlanRepo.save).toHaveBeenCalled();
  });
});
