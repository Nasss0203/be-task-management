import { Test, TestingModule } from '@nestjs/testing';
import { FindFeatureApplicationImpl } from './find.feature.application';
import { FEATURE_TYPES } from '../interfaces/types';

describe('FindFeatureApplicationImpl', () => {
  let application: FindFeatureApplicationImpl;
  const mockService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindFeatureApplicationImpl,
        {
          provide: FEATURE_TYPES.services.FindFeatureService,
          useValue: mockService,
        },
      ],
    }).compile();

    application = module.get<FindFeatureApplicationImpl>(
      FindFeatureApplicationImpl,
    );
  });

  it('should find features', async () => {
    mockService.findAll.mockResolvedValue([{ id: '1' }]);
    const result = await application.findAll();
    expect(mockService.findAll).toHaveBeenCalled();
    expect(result[0].id).toEqual('1');
  });

  it('should find by id', async () => {
    mockService.findById.mockResolvedValue({ id: '1' });
    const result = await application.findById('1');
    expect(mockService.findById).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });

  it('should find by code', async () => {
    mockService.findByCode.mockResolvedValue({ id: '1' });
    const result = await application.findByCode('c1');
    expect(mockService.findByCode).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });
});
