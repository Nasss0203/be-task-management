import { Test, TestingModule } from '@nestjs/testing';
import { SearchInviteUsersApplicationImpl } from './search-invite-users.application';
import { USER_TYPES } from 'src/modules/users/interfaces/types';
import { BadRequestException } from '@nestjs/common';
import { InviteSuggestionStatus, InviteSuggestionType } from '../dto/search-invite-user.response.dto';

describe('SearchInviteUsersApplicationImpl', () => {
  let app: SearchInviteUsersApplicationImpl;

  const mockUserService = {
    searchInviteUsers: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchInviteUsersApplicationImpl,
        { provide: USER_TYPES.services.FindUserService, useValue: mockUserService },
      ],
    }).compile();

    app = module.get<SearchInviteUsersApplicationImpl>(SearchInviteUsersApplicationImpl);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('should search users', async () => {
    mockUserService.searchInviteUsers.mockResolvedValue([{ user_id: 'u-1', email: 'test@example.com' }]);
    const result = await app.search({ workspaceId: 'ws-1', currentUserId: 'u-1', keyword: 'test' });
    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: InviteSuggestionType.USER, email: 'test@example.com' })
    ]));
  });

  it('should add email suggestion if keyword is email', async () => {
    mockUserService.searchInviteUsers.mockResolvedValue([]);
    const result = await app.search({ workspaceId: 'ws-1', currentUserId: 'u-1', keyword: 'test@example.com' });
    expect(result).toEqual([{
      type: InviteSuggestionType.EMAIL,
      user_id: null,
      username: null,
      email: 'test@example.com',
      full_name: null,
      avatar_url: null,
      status: InviteSuggestionStatus.CAN_INVITE,
    }]);
  });

  it('should throw if workspaceId missing', async () => {
    await expect(app.search({ currentUserId: 'u-1', keyword: 'test' } as any)).rejects.toThrow(BadRequestException);
  });
});
