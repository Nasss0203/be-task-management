import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  UploadRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import type { IAuth } from 'src/types/auth';

import { SetCreatorImageCommand } from '../../../application/commands/creator-profile/set-creator-image/set-creator-image.command';
import {
  CREATOR_IMAGE_MAX_BYTES,
  SetCreatorImageHandler,
} from '../../../application/commands/creator-profile/set-creator-image/set-creator-image.handler';
import { UpsertMyCreatorProfileCommand } from '../../../application/commands/creator-profile/upsert-my-creator-profile/upsert-my-creator-profile.command';
import { UpsertMyCreatorProfileHandler } from '../../../application/commands/creator-profile/upsert-my-creator-profile/upsert-my-creator-profile.handler';
import { MyCreatorProfileDto } from '../../../application/dto/creator-profile/creator-profile.response.dto';
import { GetMyCreatorProfileHandler } from '../../../application/queries/creator-profile/get-my-creator-profile/get-my-creator-profile.handler';
import { GetMyCreatorProfileQuery } from '../../../application/queries/creator-profile/get-my-creator-profile/get-my-creator-profile.query';
import { UpsertCreatorProfileRequest } from '../requests/upsert-creator-profile.request';

@Controller('creators/me/profile')
export class CreatorProfileController {
  constructor(
    @Inject(MARKETPLACE_TYPES.applications.GetMyCreatorProfileHandler)
    private readonly getHandler: GetMyCreatorProfileHandler,

    @Inject(MARKETPLACE_TYPES.applications.UpsertMyCreatorProfileHandler)
    private readonly upsertHandler: UpsertMyCreatorProfileHandler,

    @Inject(MARKETPLACE_TYPES.applications.SetCreatorImageHandler)
    private readonly setImageHandler: SetCreatorImageHandler,
  ) {}

  @Get()
  @ReadRateLimit()
  @ResponseMessage('Creator profile retrieved successfully')
  get(@Auth() auth: IAuth): Promise<MyCreatorProfileDto> {
    return this.getHandler.execute(new GetMyCreatorProfileQuery(auth.id));
  }

  @Put()
  @WriteRateLimit()
  @ResponseMessage('Creator profile saved')
  upsert(
    @Body() request: UpsertCreatorProfileRequest,
    @Auth() auth: IAuth,
  ): Promise<MyCreatorProfileDto> {
    return this.upsertHandler.execute(
      new UpsertMyCreatorProfileCommand(auth.id, {
        handle: request.handle,
        displayName: request.display_name,
        headline: request.headline,
        bio: request.bio,
        links: {
          website: request.website,
          x: request.x,
          github: request.github,
          linkedin: request.linkedin,
          youtube: request.youtube,
          facebook: request.facebook,
        },
      }),
    );
  }

  @Put('images/:kind')
  @UploadRateLimit()
  @ResponseMessage('Creator image uploaded')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: CREATOR_IMAGE_MAX_BYTES.cover },
    }),
  )
  uploadImage(
    @Param('kind') kind: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Auth() auth: IAuth,
  ): Promise<MyCreatorProfileDto> {
    return this.setImageHandler.execute(
      new SetCreatorImageCommand(
        auth.id,
        kind,
        file ? { buffer: file.buffer, size: file.size } : null,
      ),
    );
  }

  @Delete('images/:kind')
  @WriteRateLimit()
  @ResponseMessage('Creator image removed')
  removeImage(
    @Param('kind') kind: string,
    @Auth() auth: IAuth,
  ): Promise<MyCreatorProfileDto> {
    return this.setImageHandler.execute(
      new SetCreatorImageCommand(auth.id, kind, null),
    );
  }
}
