import { Body, Controller, Get, Inject, Param, Patch } from '@nestjs/common';

import { Auth } from 'src/common/decorator/auth.decorator';
import { UpdatePageShareSettingCommand } from 'src/modules/content/application/commands/update-page-share-setting/update-page-share-setting.command';
import { UpdatePageShareSettingHandler } from 'src/modules/content/application/commands/update-page-share-setting/update-page-share-setting.handler';
import { UpdatePageShareSettingRequestDto } from 'src/modules/content/application/dto/page-share-setting/request/update-page-share-setting.request.dto';
import { GetPageShareSettingHandler } from 'src/modules/content/application/queries/page-share-setting/get-page-share-setting/get-page-share-setting.handler';
import { GetPageShareSettingQuery } from 'src/modules/content/application/queries/page-share-setting/get-page-share-setting/get-page-share-setting.query';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import type { IAuth } from 'src/types/auth';

@Controller()
export class PageShareSettingsController {
  constructor(
    @Inject(CONTENT_TYPES.applications.GetPageShareSettingHandler)
    private readonly getPageShareSettingHandler: GetPageShareSettingHandler,

    @Inject(CONTENT_TYPES.applications.UpdatePageShareSettingHandler)
    private readonly updatePageShareSettingHandler: UpdatePageShareSettingHandler,
  ) {}

  @Get('page/:pageId/share-settings')
  async getShareSetting(@Param('pageId') pageId: string, @Auth() auth: IAuth) {
    return this.getPageShareSettingHandler.execute(
      new GetPageShareSettingQuery(auth.id, pageId),
    );
  }

  @Patch('page/:pageId/share-settings')
  async updateShareSetting(
    @Param('pageId') pageId: string,

    @Body()
    request: UpdatePageShareSettingRequestDto,

    @Auth() auth: IAuth,
  ) {
    return this.updatePageShareSettingHandler.execute(
      new UpdatePageShareSettingCommand(auth.id, pageId, request.generalAccess),
    );
  }
}
