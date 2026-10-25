import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  StrictWriteRateLimit,
  UploadRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { ChangePasswordDto } from 'src/modules/identity/application/dto/account/change-password.dto';
import { UpdateAccountDto } from 'src/modules/identity/application/dto/account/update-account.dto';
import { UserSearchDto } from 'src/modules/identity/application/dto/user/user-search.dto';
import { SearchUsersHandler } from 'src/modules/identity/application/queries/user/search-users/search-users.handler';
import { SearchUsersQuery } from 'src/modules/identity/application/queries/user/search-users/search-users.query';
import {
  AccountService,
  type AccountResponse,
} from 'src/modules/identity/application/services/account.service';

import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { type IAuth } from 'src/types/auth';

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

@Controller('users')
export class UsersController {
  constructor(
    @Inject(IDENTITY_TYPES.applications.SearchUsersHandler)
    private readonly searchUsersHandler: SearchUsersHandler,
    private readonly accountService: AccountService,
  ) {}

  @Get('search')
  async searchUsers(
    @Query('query')
    keyword: string,
  ): Promise<UserSearchDto[]> {
    return this.searchUsersHandler.execute(new SearchUsersQuery(keyword ?? ''));
  }

  @Get('me')
  @ReadRateLimit()
  @ResponseMessage('Get account')
  getAccount(@Auth() auth: IAuth): Promise<AccountResponse> {
    return this.accountService.getAccount(auth.id);
  }

  @Patch('me')
  @WriteRateLimit()
  @ResponseMessage('Account updated')
  updateAccount(
    @Auth() auth: IAuth,
    @Body() dto: UpdateAccountDto,
  ): Promise<AccountResponse> {
    return this.accountService.updateUsername(auth.id, dto.username);
  }

  @Post('me/password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @StrictWriteRateLimit()
  async changePassword(
    @Auth() auth: IAuth,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.accountService.changePassword(
      auth.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Put('me/avatar')
  @UploadRateLimit()
  @ResponseMessage('Avatar updated')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: AVATAR_MAX_BYTES },
    }),
  )
  uploadAvatar(
    @Auth() auth: IAuth,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(png|jpeg|webp)$/ })
        .addMaxSizeValidator({ maxSize: AVATAR_MAX_BYTES })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
  ): Promise<AccountResponse> {
    return this.accountService.setAvatar(auth.id, file.buffer);
  }

  @Delete('me/avatar')
  @WriteRateLimit()
  @ResponseMessage('Avatar removed')
  removeAvatar(@Auth() auth: IAuth): Promise<AccountResponse> {
    return this.accountService.removeAvatar(auth.id);
  }
}
