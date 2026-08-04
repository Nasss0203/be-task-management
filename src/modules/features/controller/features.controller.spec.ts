import { Test, TestingModule } from '@nestjs/testing';
import { FeaturesController } from './features.controller';
import { FEATURE_TYPES } from '../interfaces/types';

describe('FeaturesController', () => {
  let controller: FeaturesController;
  const mockCreate = { create: jest.fn() };
  const mockFind = { findAll: jest.fn(), findById: jest.fn() };
  const mockUpdate = { update: jest.fn() };
  const mockDelete = { delete: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeaturesController],
      providers: [
        {
          provide: FEATURE_TYPES.applications.CreateFeatureApplication,
          useValue: mockCreate,
        },
        {
          provide: FEATURE_TYPES.applications.FindFeatureApplication,
          useValue: mockFind,
        },
        {
          provide: FEATURE_TYPES.applications.UpdateFeatureApplication,
          useValue: mockUpdate,
        },
        {
          provide: FEATURE_TYPES.applications.DeleteFeatureApplication,
          useValue: mockDelete,
        },
      ],
    }).compile();

    controller = module.get<FeaturesController>(FeaturesController);
  });

  it('should create feature', async () => {
    mockCreate.create.mockResolvedValue({ id: '1' });
    const result = await controller.create({
      name: 'f1',
      code: 'f1',
      description: 'desc',
    });
    expect(mockCreate.create).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });

  it('should find features', async () => {
    mockFind.findAll.mockResolvedValue([{ id: '1' }]);
    const result = await controller.findAll();
    expect(mockFind.findAll).toHaveBeenCalled();
    expect(result[0].id).toEqual('1');
  });

  it('should find feature by id', async () => {
    mockFind.findById.mockResolvedValue({ id: '1' });
    const result = await controller.findOne('1');
    expect(mockFind.findById).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });

  it('should update feature', async () => {
    mockUpdate.update.mockResolvedValue({ id: '1' });
    const result = await controller.update('1', { name: 'f1' });
    expect(mockUpdate.update).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });

  it('should delete feature', async () => {
    mockDelete.delete.mockResolvedValue(true);
    const result = await controller.remove('1');
    expect(mockDelete.delete).toHaveBeenCalled();
    expect(result.success).toEqual(true);
  });
});
