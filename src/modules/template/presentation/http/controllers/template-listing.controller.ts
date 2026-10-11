import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';

import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import type { IAuth } from 'src/types/auth';

import { PublishTemplateListingCommand } from 'src/modules/template/application/commands/template-listing/publish-template-listing/publish-template-listing.command';
import { PublishTemplateListingHandler } from 'src/modules/template/application/commands/template-listing/publish-template-listing/publish-template-listing.handler';
import { UnpublishTemplateListingCommand } from 'src/modules/template/application/commands/template-listing/unpublish-template-listing/unpublish-template-listing.command';
import { UnpublishTemplateListingHandler } from 'src/modules/template/application/commands/template-listing/unpublish-template-listing/unpublish-template-listing.handler';
import { GetTemplateListingHandler } from 'src/modules/template/application/queries/template-listing/get-template-listing/get-template-listing.handler';
import { GetTemplateListingQuery } from 'src/modules/template/application/queries/template-listing/get-template-listing/get-template-listing.query';
import { CreateTemplateListingCommand } from '../../../application/commands/template-listing/create-template-listing/create-template-listing.command';
import { CreateTemplateListingHandler } from '../../../application/commands/template-listing/create-template-listing/create-template-listing.handler';
import { TEMPLATE_TYPES } from '../../../template.types';

import { PublishTemplateToMarketplaceHandler } from '../../../application/commands/publish-template-to-marketplace/publish-template-to-marketplace.handler';
import { PublishTemplateToMarketplaceCommand } from '../../../application/commands/publish-template-to-marketplace/publish-template-to-marketplace.command';
import { PublishTemplateToMarketplaceRequest } from '../requests/publish-template-to-marketplace.request';

@Controller('templates')
export class TemplateListingController {
  constructor(
    @Inject(TEMPLATE_TYPES.applications.PublishTemplateToMarketplaceHandler)
    private readonly marketplacePublisher: PublishTemplateToMarketplaceHandler,
    @Inject(TEMPLATE_TYPES.applications.CreateTemplateListingHandler)
    private readonly createTemplateListingHandler: CreateTemplateListingHandler,

    @Inject(TEMPLATE_TYPES.applications.PublishTemplateListingHandler)
    private readonly publishTemplateListingHandler: PublishTemplateListingHandler,

    @Inject(TEMPLATE_TYPES.applications.UnpublishTemplateListingHandler)
    private readonly unpublishTemplateListingHandler: UnpublishTemplateListingHandler,

    @Inject(TEMPLATE_TYPES.applications.GetTemplateListingHandler)
    private readonly getTemplateListingHandler: GetTemplateListingHandler,
  ) {}

  @Post(':templateId/marketplace/publish')
  @WriteRateLimit()
  @ResponseMessage('Template published to marketplace successfully')
  async publishToMarketplace(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() request: PublishTemplateToMarketplaceRequest,
    @Auth() auth: IAuth,
  ) {
    return this.marketplacePublisher.execute(
      new PublishTemplateToMarketplaceCommand(
        templateId,
        request.version_id,
        auth.id,
        request.offer_type,
      ),
    );
  }

  @Post(':templateId/listing')
  @WriteRateLimit()
  @ResponseMessage('Template listing created successfully')
  async create(@Param('templateId') templateId: string, @Auth() auth: IAuth) {
    return this.createTemplateListingHandler.execute(
      new CreateTemplateListingCommand(templateId, auth.id),
    );
  }

  @Post(':templateId/listing/publish')
  @WriteRateLimit()
  @ResponseMessage('Template listing published successfully')
  async publish(@Param('templateId') templateId: string, @Auth() auth: IAuth) {
    return this.publishTemplateListingHandler.execute(
      new PublishTemplateListingCommand(templateId, auth.id),
    );
  }

  @Post(':templateId/listing/unPublish')
  @WriteRateLimit()
  @ResponseMessage('Template listing unPublished successfully')
  async unPublish(
    @Param('templateId') templateId: string,
    @Auth() auth: IAuth,
  ) {
    return this.unpublishTemplateListingHandler.execute(
      new UnpublishTemplateListingCommand(templateId, auth.id),
    );
  }

  @Get(':templateId/listing')
  @ReadRateLimit()
  @ResponseMessage('Template listing retrieved successfully')
  async getListing(
    @Param('templateId') templateId: string,
    @Auth() auth: IAuth,
  ) {
    return this.getTemplateListingHandler.execute(
      new GetTemplateListingQuery(templateId, auth.id),
    );
  }
}
