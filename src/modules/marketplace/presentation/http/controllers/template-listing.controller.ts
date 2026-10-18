import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
} from '@nestjs/common';

import { Auth } from 'src/common/decorator/auth.decorator';
import {
  ReadRateLimit,
  WriteRateLimit,
} from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import type { IAuth } from 'src/types/auth';

import { PublishTemplateListingCommand } from 'src/modules/marketplace/application/commands/template-listing/publish-template-listing/publish-template-listing.command';
import { PublishTemplateListingHandler } from 'src/modules/marketplace/application/commands/template-listing/publish-template-listing/publish-template-listing.handler';
import { UnpublishTemplateListingCommand } from 'src/modules/marketplace/application/commands/template-listing/unpublish-template-listing/unpublish-template-listing.command';
import { UnpublishTemplateListingHandler } from 'src/modules/marketplace/application/commands/template-listing/unpublish-template-listing/unpublish-template-listing.handler';
import { GetTemplateListingHandler } from 'src/modules/marketplace/application/queries/template-listing/get-template-listing/get-template-listing.handler';
import { GetTemplateListingQuery } from 'src/modules/marketplace/application/queries/template-listing/get-template-listing/get-template-listing.query';
import { CreateTemplateListingCommand } from '../../../application/commands/template-listing/create-template-listing/create-template-listing.command';
import { CreateTemplateListingHandler } from '../../../application/commands/template-listing/create-template-listing/create-template-listing.handler';
import { PublishTemplateToMarketplaceHandler } from '../../../application/commands/publish-template-to-marketplace/publish-template-to-marketplace.handler';
import { PublishTemplateToMarketplaceCommand } from '../../../application/commands/publish-template-to-marketplace/publish-template-to-marketplace.command';
import { PublishTemplateToMarketplaceRequest } from '../requests/publish-template-to-marketplace.request';
import { CreateTemplateListingRequest } from '../requests/create-template-listing.request';
import { UpdateTemplateListingPricingRequest } from '../requests/update-template-listing-pricing.request';
import { UpdateTemplateListingPricingCommand } from '../../../application/commands/template-listing/update-template-listing-pricing/update-template-listing-pricing.command';
import { UpdateTemplateListingPricingHandler } from '../../../application/commands/template-listing/update-template-listing-pricing/update-template-listing-pricing.handler';
import { PreviewTemplateDemoHandler } from '../../../application/queries/template-preview/preview-template-demo/preview-template-demo.handler';
import { PreviewTemplateDemoQuery } from '../../../application/queries/template-preview/preview-template-demo/preview-template-demo.query';
import { PreviewTemplateDemoRequest } from '../requests/preview-template-demo.request';

@Controller('templates')
export class TemplateListingController {
  constructor(
    @Inject(MARKETPLACE_TYPES.applications.UpdateTemplateListingPricingHandler)
    private readonly pricingHandler: UpdateTemplateListingPricingHandler,
    @Inject(MARKETPLACE_TYPES.applications.PublishTemplateToMarketplaceHandler)
    private readonly marketplacePublisher: PublishTemplateToMarketplaceHandler,
    @Inject(MARKETPLACE_TYPES.applications.CreateTemplateListingHandler)
    private readonly createTemplateListingHandler: CreateTemplateListingHandler,

    @Inject(MARKETPLACE_TYPES.applications.PublishTemplateListingHandler)
    private readonly publishTemplateListingHandler: PublishTemplateListingHandler,

    @Inject(MARKETPLACE_TYPES.applications.UnpublishTemplateListingHandler)
    private readonly unpublishTemplateListingHandler: UnpublishTemplateListingHandler,

    @Inject(MARKETPLACE_TYPES.applications.GetTemplateListingHandler)
    private readonly getTemplateListingHandler: GetTemplateListingHandler,

    @Inject(MARKETPLACE_TYPES.applications.PreviewTemplateDemoHandler)
    private readonly previewTemplateDemoHandler: PreviewTemplateDemoHandler,
  ) {}

  // POST because it carries an unsaved config; it never writes anything.
  @Post(':templateId/listing/demo-preview')
  @ReadRateLimit()
  @ResponseMessage('Template demo preview generated successfully')
  async previewDemo(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() request: PreviewTemplateDemoRequest,
    @Auth() auth: IAuth,
  ) {
    return this.previewTemplateDemoHandler.execute(
      new PreviewTemplateDemoQuery(
        templateId,
        auth.id,
        request.demo_version_id,
        request.demo_config,
      ),
    );
  }

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
        request.category_ids,
        request.price_amount,
        request.currency,
        request.preview_mode,
        request.demo_version_id,
        request.demo_config,
        request.tags,
      ),
    );
  }

  @Post(':templateId/listing')
  @WriteRateLimit()
  @ResponseMessage('Template listing created successfully')
  async create(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() request: CreateTemplateListingRequest,
    @Auth() auth: IAuth,
  ) {
    return this.createTemplateListingHandler.execute(
      new CreateTemplateListingCommand(
        templateId,
        auth.id,
        request?.offer_type,
        request?.price_amount,
        request?.currency,
        request?.preview_mode,
        request?.demo_version_id,
        request?.demo_config,
      ),
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

  @Patch(':templateId/listing')
  @WriteRateLimit()
  @ResponseMessage('Template listing updated successfully')
  async updateListing(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() request: UpdateTemplateListingPricingRequest,
    @Auth() auth: IAuth,
  ) {
    return this.pricingHandler.execute(
      new UpdateTemplateListingPricingCommand(
        templateId,
        auth.id,
        request.offer_type,
        request.price_amount,
        request.currency,
        request.preview_mode,
        request.demo_version_id,
        request.demo_config,
      ),
    );
  }

  @Patch(':templateId/listing/pricing')
  @WriteRateLimit()
  @ResponseMessage('Template listing pricing updated successfully')
  async updatePricing(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() request: UpdateTemplateListingPricingRequest,
    @Auth() auth: IAuth,
  ) {
    return this.updateListing(templateId, request, auth);
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
