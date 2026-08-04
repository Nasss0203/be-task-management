import { Test, TestingModule } from '@nestjs/testing';
import { DeleteFeatureApplicationImpl } from './delete.feature.application';
import { FEATURE_TYPES } from '../interfaces/types';

describe('DeleteFeatureApplicationImpl', () => {
  let application: DeleteFeatureApplicationImpl;
  const mockService = { delete: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteFeatureApplicationImpl,
        {
          provide: FEATURE_TYPES.services.DeleteFeatureService,
          useValue: mockService,
        },
      ],
    }).compile();

    application = module.get<DeleteFeatureApplicationImpl>(
      DeleteFeatureApplicationImpl,
    );
  });

  it('should delete feature', async () => {
    mockService.delete.mockResolvedValue(undefined);
    await application.delete('1');
    expect(mockService.delete).toHaveBeenCalled();
  });
});
