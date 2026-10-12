import { Controller, Get, Inject } from '@nestjs/common';

import { ResponseMessage } from 'src/common/decorator/response-message.decorator';

import { ListActiveTemplateCategoriesHandler } from 'src/modules/template/application/queries/template-category/list-active-template-categories/list-active-template-categories.handler';
import { ListActiveTemplateCategoriesQuery } from 'src/modules/template/application/queries/template-category/list-active-template-categories/list-active-template-categories.query';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';
import { TemplateCategoryResponseDto } from '../../../application/dto/template-category/template-category.response.dto';

@Controller('public/template-categories')
export class PublicTemplateCategoryController {
  constructor(
    @Inject(TEMPLATE_TYPES.applications.ListActiveTemplateCategoriesHandler)
    private readonly listActiveTemplateCategoriesHandler: ListActiveTemplateCategoriesHandler,
  ) {}

  @Get()
  @ResponseMessage('Get template categories successfully')
  list(): Promise<TemplateCategoryResponseDto[]> {
    return this.listActiveTemplateCategoriesHandler.execute(
      new ListActiveTemplateCategoriesQuery(),
    );
  }
}
