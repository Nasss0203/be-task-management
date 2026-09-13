import { Controller, Get, Inject, Query } from '@nestjs/common';
import { UserSearchDto } from 'src/modules/identity/application/dto/user/user-search.dto';
import { SearchUsersHandler } from 'src/modules/identity/application/queries/user/search-users/search-users.handler';
import { SearchUsersQuery } from 'src/modules/identity/application/queries/user/search-users/search-users.query';

import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';

@Controller('users')
export class UsersController {
  constructor(
    @Inject(IDENTITY_TYPES.applications.SearchUsersHandler)
    private readonly searchUsersHandler: SearchUsersHandler,
  ) {}

  @Get('search')
  async searchUsers(
    @Query('query')
    keyword: string,
  ): Promise<UserSearchDto[]> {
    return this.searchUsersHandler.execute(new SearchUsersQuery(keyword ?? ''));
  }
}
