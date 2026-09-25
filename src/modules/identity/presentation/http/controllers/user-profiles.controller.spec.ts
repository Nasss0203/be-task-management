import { Test, TestingModule } from '@nestjs/testing';
import { GetUserProfileHandler } from '../../../application/queries/get-user-profile/get-user-profile.handler';
import { SystemRole } from '../../../domain/enums/system-role.enum';
import { UserProfilesController } from './user-profiles.controller';

describe('UserProfilesController', () => {
  let controller: UserProfilesController;
  const execute: jest.MockedFunction<GetUserProfileHandler['execute']> =
    jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserProfilesController],
      providers: [
        {
          provide: GetUserProfileHandler,
          useValue: { execute },
        },
      ],
    }).compile();

    controller = module.get<UserProfilesController>(UserProfilesController);
  });

  it('gets the current user profile through the handler', async () => {
    const profile = {
      id: 'profile-1',
      userId: 'user-1',
      lastActiveWorkspaceId: null,
      displayName: 'Test User',
      fullName: 'Test User',
      bio: null,
      phoneNumber: null,
      location: null,
      jobTitle: null,
      website: null,
      coverUrl: null,
      timezone: null,
      language: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    execute.mockResolvedValue(profile);

    const result = await controller.getCurrentProfile({
      id: 'user-1',
      username: 'test-user',
      email: 'test@example.com',
      systemRole: SystemRole.USER,
    });

    expect(controller).toBeDefined();
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1' }),
    );
    expect(result).toBe(profile);
  });
});
