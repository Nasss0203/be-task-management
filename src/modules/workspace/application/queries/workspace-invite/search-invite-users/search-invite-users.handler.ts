import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { type FindUserService } from 'src/modules/identity/application/ports/find-user.service.interface';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import {
  InviteSuggestionStatus,
  InviteSuggestionType,
  SearchInviteUserResponseDto,
} from 'src/modules/workspace/application/dto/workspace-invite/search-invite-user.response.dto';
import { SearchInviteUsersQuery } from './search-invite-users.query';

@Injectable()
export class SearchInviteUsersHandler {
  constructor(
    @Inject(IDENTITY_TYPES.services.FindUserService)
    private readonly findUserService: FindUserService,
  ) {}

  async execute(
    query: SearchInviteUsersQuery,
  ): Promise<SearchInviteUserResponseDto[]> {
    if (!query.workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    if (!query.currentUserId) {
      throw new BadRequestException('currentUserId is required');
    }

    const keyword = query.keyword?.trim();

    if (!keyword || keyword.length < 2) {
      return [];
    }

    const users = await this.findUserService.searchInviteUsers({
      workspaceId: query.workspaceId,
      keyword,
      currentUserId: query.currentUserId,
    });

    const result: SearchInviteUserResponseDto[] = users.map((user) => ({
      type: InviteSuggestionType.USER,
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      status: user.status as InviteSuggestionStatus,
    }));

    const isEmail = this.isEmail(keyword);

    const existedEmail = result.some(
      (item) => item.email.toLowerCase() === keyword.toLowerCase(),
    );

    if (isEmail && !existedEmail) {
      result.unshift({
        type: InviteSuggestionType.EMAIL,
        user_id: null,
        username: null,
        email: keyword.toLowerCase(),
        full_name: null,
        avatar_url: null,
        status: InviteSuggestionStatus.CAN_INVITE,
      });
    }

    return result;
  }

  private isEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
