import { Inject, Injectable } from '@nestjs/common';
import {
  SearchUsersOutput,
  type UserRepository,
} from 'src/modules/identity/domain/repositories/user.repository';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { UserModel } from '../../domain/aggregates/user/user.model';
import {
  FindUserService,
  SearchInviteUsersServiceInput,
  SearchInviteUsersServiceOutput,
} from '../ports/find-user.service.interface';

@Injectable()
export class FindUserServiceImpl implements FindUserService {
  constructor(
    @Inject(IDENTITY_TYPES.repositories.UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  findUserByUsername(username: string): Promise<UserModel | null> {
    return this.userRepository.findUserByUsername(username);
  }

  findUserByEmail(email: string): Promise<UserModel | null> {
    return this.userRepository.findUserByEmail(email);
  }

  findUserById(id: string): Promise<UserModel | null> {
    return this.userRepository.findUserById(id);
  }

  async searchUsers(keyword: string): Promise<SearchUsersOutput[]> {
    return this.userRepository.searchUsers(keyword);
  }

  async searchInviteUsers(
    input: SearchInviteUsersServiceInput,
  ): Promise<SearchInviteUsersServiceOutput[]> {
    const keyword = input.keyword.trim();

    if (keyword.length < 2) {
      return [];
    }

    return this.userRepository.searchInviteUsers({
      workspaceId: input.workspaceId,
      keyword,
      currentUserId: input.currentUserId,
    });
  }
}
