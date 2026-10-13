import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { Inject, Injectable } from '@nestjs/common';

import type { TemplateCategoryRepository } from '../../../../domain/repositories/template-category.repository';
import { TemplateCategoryResponseDto } from '../../../dto/template-category/template-category.response.dto';

import { ListTemplateCategoriesQuery } from './list-template-categories.query';

@Injectable()
export class ListTemplateCategoriesHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.TemplateCategoryRepository)
    private readonly templateCategoryRepository: TemplateCategoryRepository,
  ) {}

  async execute(
    _query: ListTemplateCategoriesQuery,
  ): Promise<TemplateCategoryResponseDto[]> {
    const categories = await this.templateCategoryRepository.findAll();

    return categories.map((category) =>
      TemplateCategoryResponseDto.fromDomain(category),
    );
  }
}
