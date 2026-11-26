import { Controller, Get, Param, Query } from '@nestjs/common';
import { Public } from 'src/common/decorator/public.decorator';
import { PublicReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { CreatePublicSiteAttachmentDownloadUrlHandler } from '../../../application/queries/create-public-site-attachment-download-url/create-public-site-attachment-download-url.handler';
import { CreatePublicSiteAttachmentDownloadUrlQuery } from '../../../application/queries/create-public-site-attachment-download-url/create-public-site-attachment-download-url.query';

@Controller('public/sites')
export class PublicSiteAttachmentController {
  constructor(
    private readonly createPublicSiteAttachmentDownloadUrlHandler: CreatePublicSiteAttachmentDownloadUrlHandler,
  ) {}

  @Get(':subdomain/attachments/:attachmentId/download-url')
  @Public()
  @PublicReadRateLimit()
  @ResponseMessage('Get public file URL')
  createDownloadUrl(
    @Param('subdomain') subdomain: string,
    @Param('attachmentId') attachmentId: string,
    @Query('path') path?: string,
  ) {
    return this.createPublicSiteAttachmentDownloadUrlHandler.execute(
      new CreatePublicSiteAttachmentDownloadUrlQuery(
        subdomain,
        path ?? '/',
        attachmentId,
      ),
    );
  }
}
