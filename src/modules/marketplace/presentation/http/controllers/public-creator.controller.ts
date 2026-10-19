import { Controller, Get, Inject, Param } from '@nestjs/common';

import { Public } from 'src/common/decorator/public.decorator';
import { ReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';

import { PublicCreatorProfileDto } from '../../../application/dto/creator-profile/creator-profile.response.dto';
import { GetPublicCreatorProfileHandler } from '../../../application/queries/creator-profile/get-public-creator-profile/get-public-creator-profile.handler';
import { GetPublicCreatorProfileQuery } from '../../../application/queries/creator-profile/get-public-creator-profile/get-public-creator-profile.query';

@Controller('public/creators')
export class PublicCreatorController {
  constructor(
    @Inject(MARKETPLACE_TYPES.applications.GetPublicCreatorProfileHandler)
    private readonly getHandler: GetPublicCreatorProfileHandler,
  ) {}

  @Public()
  @Get(':handle')
  @ReadRateLimit()
  @ResponseMessage('Creator profile retrieved successfully')
  get(@Param('handle') handle: string): Promise<PublicCreatorProfileDto> {
    return this.getHandler.execute(new GetPublicCreatorProfileQuery(handle));
  }
}
