import { Test, TestingModule } from '@nestjs/testing';
import { UserActivityController } from './user_activity.controller';
import { UserActivityService } from '../services/user_activity.service';

describe('UserActivityController', () => {
  let controller: UserActivityController;

  const mockService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserActivityController],
      providers: [{ provide: UserActivityService, useValue: mockService }],
    }).compile();

    controller = module.get<UserActivityController>(UserActivityController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should record activity', async () => {
    const result = await controller.record({ userId: 'u-1' });
    expect(mockService.record).toHaveBeenCalled();
    expect(result.success).toEqual(true);
  });
});
