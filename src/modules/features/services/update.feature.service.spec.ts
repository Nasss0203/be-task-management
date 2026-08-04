import { Test, TestingModule } from '@nestjs/testing';
import { UpdateFeatureServiceImpl } from './update.feature.service';
import { FEATURE_TYPES } from '../interfaces/types';

describe('UpdateFeatureServiceImpl', () => {
  let service: UpdateFeatureServiceImpl;
  const mockRepo = { save: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateFeatureServiceImpl,
        {
          provide: FEATURE_TYPES.repositories.UpdateFeatureRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<UpdateFeatureServiceImpl>(UpdateFeatureServiceImpl);
  });

  it('should update feature', async () => {
    mockRepo.save.mockResolvedValue({ id: '1', name: 'f1' });
    const result = await service.update('1', { name: 'f1' });
    expect(mockRepo.save).toHaveBeenCalled();
    expect(result.name).toEqual('f1');
  });
});
