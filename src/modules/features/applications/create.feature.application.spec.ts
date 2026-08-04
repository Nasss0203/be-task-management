import { Test, TestingModule } from '@nestjs/testing';
import { CreateFeatureApplicationImpl } from './create.feature.application';
import { FEATURE_TYPES } from '../interfaces/types';

describe('CreateFeatureApplicationImpl', () => {
  let application: CreateFeatureApplicationImpl;
  const mockService = { create: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateFeatureApplicationImpl,
        {
          provide: FEATURE_TYPES.services.CreateFeatureService,
          useValue: mockService,
        },
      ],
    }).compile();

    application = module.get<CreateFeatureApplicationImpl>(
      CreateFeatureApplicationImpl,
    );
  });

  it('should create feature', async () => {
    mockService.create.mockResolvedValue({ id: '1' });
    const result = await application.create({
      name: 'f1',
      code: 'f1',
      description: 'desc',
    });
    expect(mockService.create).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });
});
