import { Inject, Injectable } from '@nestjs/common';

import type { UserRepository } from 'src/modules/identity/domain/repositories/user.repository';

import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';

import { UserSearchDto } from '../../../dto/user/user-search.dto';
import { SearchUsersQuery } from './search-users.query';

@Injectable()
export class SearchUsersHandler {
  constructor(
    @Inject(IDENTITY_TYPES.repositories.UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(query: SearchUsersQuery): Promise<UserSearchDto[]> {
    const keyword = query.keyword.trim();

    if (keyword.length < 2) {
      return [];
    }

    const users = await this.userRepository.searchUsers(keyword);

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    }));
  }
}
