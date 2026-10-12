import { Inject, Injectable } from '@nestjs/common';

import { TemplateCategory } from '../../../../domain/aggregates/template-category/template-category.aggregate';
import type { TemplateCategoryRepository } from '../../../../domain/repositories/template-category.repository';
import { TEMPLATE_TYPES } from '../../../../template.types';
import { TemplateCategoryResponseDto } from '../../../dto/template-category/template-category.response.dto';
import { ListActiveTemplateCategoriesQuery } from './list-active-template-categories.query';

@Injectable()
export class ListActiveTemplateCategoriesHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.repositories.TemplateCategoryRepository)
    private readonly repository: TemplateCategoryRepository,
  ) {}

  async execute(
    _query: ListActiveTemplateCategoriesQuery,
  ): Promise<TemplateCategoryResponseDto[]> {
    const categories = await this.repository.findAllActive();

    return categories.map((category: TemplateCategory) =>
      TemplateCategoryResponseDto.fromDomain(category),
    );
  }
}
