import { Test, TestingModule } from '@nestjs/testing';
import { FindFeatureServiceImpl } from './find.feature.service';
import { FEATURE_TYPES } from '../interfaces/types';
import { NotFoundException } from '@nestjs/common';

describe('FindFeatureServiceImpl', () => {
  let service: FindFeatureServiceImpl;
  const mockRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindFeatureServiceImpl,
        {
          provide: FEATURE_TYPES.repositories.FindFeatureRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<FindFeatureServiceImpl>(FindFeatureServiceImpl);
  });

  it('should find features', async () => {
    mockRepo.findAll.mockResolvedValue([{ id: '1' }]);
    const result = await service.findAll();
    expect(mockRepo.findAll).toHaveBeenCalled();
    expect(result[0].id).toEqual('1');
  });

  it('should find feature by id', async () => {
    mockRepo.findById.mockResolvedValue({ id: '1' });
    const result = await service.findById('1');
    expect(mockRepo.findById).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });

  it('should fail if feature by id not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.findById('1')).rejects.toThrow(NotFoundException);
  });

  it('should find feature by code', async () => {
    mockRepo.findByCode.mockResolvedValue({ id: '1' });
    const result = await service.findByCode('c1');
    expect(mockRepo.findByCode).toHaveBeenCalled();
    expect(result.id).toEqual('1');
  });

  it('should fail if feature by code not found', async () => {
    mockRepo.findByCode.mockResolvedValue(null);
    await expect(service.findByCode('c1')).rejects.toThrow(NotFoundException);
  });
});
