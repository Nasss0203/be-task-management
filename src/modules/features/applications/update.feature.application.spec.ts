import { Test, TestingModule } from '@nestjs/testing';
import { UpdateFeatureApplicationImpl } from './update.feature.application';
import { FEATURE_TYPES } from '../interfaces/types';

describe('UpdateFeatureApplicationImpl', () => {
  let application: UpdateFeatureApplicationImpl;
  const mockService = { update: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateFeatureApplicationImpl,
        { provide: FEATURE_TYPES.services.UpdateFeatureService, useValue: mockService },
      ],
    }).compile();

    application = module.get<UpdateFeatureApplicationImpl>(UpdateFeatureApplicationImpl);
  });

  it('should update feature', async () => {
    mockService.update.mockResolvedValue({ id: '1' });
    const result = await application.update('1', { name: 'f1' });
    expect(mockService.update).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });
});
