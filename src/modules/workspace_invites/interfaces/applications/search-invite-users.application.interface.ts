import { SearchInviteUserResponseDto } from '../../dto/search-invite-user.response.dto';

export interface SearchInviteUsersApplicationInput {
  workspaceId: string;
  keyword: string;
  currentUserId: string;
}

export interface SearchInviteUsersApplication {
  search(
    input: SearchInviteUsersApplicationInput,
  ): Promise<SearchInviteUserResponseDto[]>;
}
