import { Test, TestingModule } from '@nestjs/testing';
import { FindWorkspaceFeatureSettingServiceImpl } from './find.workspace_feature_setting.service';
import { WORKSPACE_FEATURE_SETTING_TYPES } from '../interfaces/types';
import { NotFoundException } from '@nestjs/common';

describe('FindWorkspaceFeatureSettingServiceImpl', () => {
  let service: FindWorkspaceFeatureSettingServiceImpl;

  const mockRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByWorkspaceAndFeature: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindWorkspaceFeatureSettingServiceImpl,
        { provide: WORKSPACE_FEATURE_SETTING_TYPES.repositories.FindWorkspaceFeatureSettingRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<FindWorkspaceFeatureSettingServiceImpl>(FindWorkspaceFeatureSettingServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all', async () => {
    mockRepo.findAll.mockResolvedValue([{ id: 'set-1' }]);
    const result = await service.findAll();
    expect(mockRepo.findAll).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'set-1' }]);
  });

  it('should find by id', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'set-1' });
    const result = await service.findById('set-1');
    expect(mockRepo.findById).toHaveBeenCalledWith('set-1', undefined);
    expect(result).toEqual({ id: 'set-1' });
  });

  it('should throw NotFoundException when finding by id', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(service.findById('set-1')).rejects.toThrow(NotFoundException);
  });

  it('should find by workspace and feature', async () => {
    mockRepo.findByWorkspaceAndFeature.mockResolvedValue({ id: 'set-1' });
    const result = await service.findByWorkspaceAndFeature('ws-1', 'feat-1');
    expect(mockRepo.findByWorkspaceAndFeature).toHaveBeenCalledWith('ws-1', 'feat-1', undefined);
    expect(result).toEqual({ id: 'set-1' });
  });

  it('should throw NotFoundException when finding by workspace and feature', async () => {
    mockRepo.findByWorkspaceAndFeature.mockResolvedValue(null);
    await expect(service.findByWorkspaceAndFeature('ws-1', 'feat-1')).rejects.toThrow(NotFoundException);
  });
});
