import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { type FindUserService } from 'src/modules/users/interfaces/services/find-user.service.interface';
import { USER_TYPES } from 'src/modules/users/interfaces/types';

import {
  InviteSuggestionStatus,
  InviteSuggestionType,
  SearchInviteUserResponseDto,
} from '../dto/search-invite-user.response.dto';
import {
  SearchInviteUsersApplication,
  SearchInviteUsersApplicationInput,
} from '../interfaces/applications/search-invite-users.application.interface';

@Injectable()
export class SearchInviteUsersApplicationImpl implements SearchInviteUsersApplication {
  constructor(
    @Inject(USER_TYPES.services.FindUserService)
    private readonly findUserService: FindUserService,
  ) {}

  async search(
    input: SearchInviteUsersApplicationInput,
  ): Promise<SearchInviteUserResponseDto[]> {
    if (!input.workspaceId) {
      throw new BadRequestException('workspaceId is required');
    }

    if (!input.currentUserId) {
      throw new BadRequestException('currentUserId is required');
    }

    const keyword = input.keyword?.trim();

    if (!keyword || keyword.length < 2) {
      return [];
    }

    const users = await this.findUserService.searchInviteUsers({
      workspaceId: input.workspaceId,
      keyword,
      currentUserId: input.currentUserId,
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
