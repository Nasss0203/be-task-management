import { Test, TestingModule } from '@nestjs/testing';
import { CreateFeatureServiceImpl } from './create.feature.service';
import { FEATURE_TYPES } from '../interfaces/types';

describe('CreateFeatureServiceImpl', () => {
  let service: CreateFeatureServiceImpl;
  const mockRepo = { save: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateFeatureServiceImpl,
        { provide: FEATURE_TYPES.repositories.CreateFeatureRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CreateFeatureServiceImpl>(CreateFeatureServiceImpl);
  });

  it('should create feature', async () => {
    mockRepo.save.mockResolvedValue({ id: '1' });
    const result = await service.create({ name: 'f1', code: 'f1', description: 'desc' });
    expect(mockRepo.save).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });
});
