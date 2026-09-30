import { Controller, Get, Inject, Param, Query } from '@nestjs/common';

import { GetPublicPageHandler } from 'src/modules/content/application/queries/page-publication/get-public-page/get-public-page.handler';
import { GetPublicPageQuery } from 'src/modules/content/application/queries/page-publication/get-public-page/get-public-page.query';
import { GetPublicSiteNavigationHandler } from 'src/modules/content/application/queries/page-publication/get-public-site-navigation/get-public-site-navigation.handler';
import { GetPublicSiteNavigationQuery } from 'src/modules/content/application/queries/page-publication/get-public-site-navigation/get-public-site-navigation.query';

import { CONTENT_TYPES } from 'src/modules/content/content.types';

import { Public } from 'src/common/decorator/public.decorator';
import { PublicReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';

@Controller('public/sites')
export class PublicPageController {
  constructor(
    @Inject(CONTENT_TYPES.applications.GetPublicPageHandler)
    private readonly getPublicPageHandler: GetPublicPageHandler,
    @Inject(CONTENT_TYPES.applications.GetPublicSiteNavigationHandler)
    private readonly getPublicSiteNavigationHandler: GetPublicSiteNavigationHandler,
  ) {}

  @Get(':subdomain/navigation')
  @Public()
  @PublicReadRateLimit()
  @ResponseMessage('Get public site navigation')
  getPublicSiteNavigation(@Param('subdomain') subdomain: string) {
    return this.getPublicSiteNavigationHandler.execute(
      new GetPublicSiteNavigationQuery(subdomain),
    );
  }

  @Get(':subdomain')
  @Public()
  @PublicReadRateLimit()
  @ResponseMessage('Get public page')
  getPublicPage(
    @Param('subdomain') subdomain: string,
    @Query('path') path?: string,
  ) {
    return this.getPublicPageHandler.execute(
      new GetPublicPageQuery(subdomain, path ?? '/'),
    );
  }
}
