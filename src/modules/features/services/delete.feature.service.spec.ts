import { Test, TestingModule } from '@nestjs/testing';
import { DeleteFeatureServiceImpl } from './delete.feature.service';
import { FEATURE_TYPES } from '../interfaces/types';

describe('DeleteFeatureServiceImpl', () => {
  let service: DeleteFeatureServiceImpl;
  const mockFindService = { findById: jest.fn() };
  const mockRepo = { softDelete: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteFeatureServiceImpl,
        { provide: FEATURE_TYPES.services.FindFeatureService, useValue: mockFindService },
        { provide: FEATURE_TYPES.repositories.DeleteFeatureRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<DeleteFeatureServiceImpl>(DeleteFeatureServiceImpl);
  });

  it('should delete feature', async () => {
    mockFindService.findById.mockResolvedValue({ id: '1' });
    mockRepo.softDelete.mockResolvedValue(true);
    await service.delete('1');
    expect(mockFindService.findById).toHaveBeenCalledWith('1', undefined);
    expect(mockRepo.softDelete).toHaveBeenCalledWith('1', undefined);
  });
});
