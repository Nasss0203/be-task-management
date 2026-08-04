import { Test, TestingModule } from '@nestjs/testing';
import { UserActivityService } from './user_activity.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  UserActivity,
  UserActivityType,
} from '../domain/entities/user_activity.entity';

describe('UserActivityService', () => {
  let service: UserActivityService;

  const mockRepo = {
    insert: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserActivityService,
        { provide: getRepositoryToken(UserActivity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<UserActivityService>(UserActivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should record user activity', async () => {
    await service.record('u-1', UserActivityType.OPEN_APP);
    expect(mockRepo.insert).toHaveBeenCalledWith({
      userId: 'u-1',
      type: UserActivityType.OPEN_APP,
    });
  });

  it('should record open app as default', async () => {
    await service.record('u-1');
    expect(mockRepo.insert).toHaveBeenCalledWith({
      userId: 'u-1',
      type: UserActivityType.OPEN_APP,
    });
  });

  it('should record login', async () => {
    await service.recordLogin('u-1');
    expect(mockRepo.insert).toHaveBeenCalledWith({
      userId: 'u-1',
      type: UserActivityType.LOGIN,
    });
  });

  it('should record open app wrapper', async () => {
    await service.recordOpenApp('u-1');
    expect(mockRepo.insert).toHaveBeenCalledWith({
      userId: 'u-1',
      type: UserActivityType.OPEN_APP,
    });
  });

  it('should record open workspace', async () => {
    await service.recordOpenWorkspace('u-1');
    expect(mockRepo.insert).toHaveBeenCalledWith({
      userId: 'u-1',
      type: UserActivityType.OPEN_WORKSPACE,
    });
  });
});
