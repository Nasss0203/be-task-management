import { Test, TestingModule } from '@nestjs/testing';
import { PERMISSION_TYPES } from '../interfaces/types';
import { FindPermissionServiceImpl } from './find-all-permission.service';

describe('FindPermissionServiceImpl', () => {
  let service: FindPermissionServiceImpl;

  const mockRepo = {
    findPermissionsByUserAndWorkspace: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindPermissionServiceImpl,
        {
          provide: PERMISSION_TYPES.repositories.FindPermissionRepository,
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<FindPermissionServiceImpl>(FindPermissionServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findPermissionsByUserAndWorkspace', () => {
    it('should call repo to find permissions', async () => {
      mockRepo.findPermissionsByUserAndWorkspace.mockResolvedValue(['READ', 'WRITE']);

      const result = await service.findPermissionsByUserAndWorkspace('u-1', 'ws-1');

      expect(mockRepo.findPermissionsByUserAndWorkspace).toHaveBeenCalledWith('u-1', 'ws-1', undefined);
      expect(result).toEqual(['READ', 'WRITE']);
    });
  });
});
