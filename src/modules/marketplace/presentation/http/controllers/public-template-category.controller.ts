import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { Controller, Get, Inject } from '@nestjs/common';

import { Public } from 'src/common/decorator/public.decorator';
import { PublicReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';

import { ListActiveTemplateCategoriesHandler } from 'src/modules/marketplace/application/queries/template-category/list-active-template-categories/list-active-template-categories.handler';
import { ListActiveTemplateCategoriesQuery } from 'src/modules/marketplace/application/queries/template-category/list-active-template-categories/list-active-template-categories.query';
import { TemplateCategoryResponseDto } from '../../../application/dto/template-category/template-category.response.dto';

@Controller('public/template-categories')
export class PublicTemplateCategoryController {
  constructor(
    @Inject(MARKETPLACE_TYPES.applications.ListActiveTemplateCategoriesHandler)
    private readonly listActiveTemplateCategoriesHandler: ListActiveTemplateCategoriesHandler,
  ) {}

  // Guests filter the public marketplace by category; read-only, active only.
  @Public()
  @Get()
  @PublicReadRateLimit()
  @ResponseMessage('Get template categories successfully')
  list(): Promise<TemplateCategoryResponseDto[]> {
    return this.listActiveTemplateCategoriesHandler.execute(
      new ListActiveTemplateCategoriesQuery(),
    );
  }
}
