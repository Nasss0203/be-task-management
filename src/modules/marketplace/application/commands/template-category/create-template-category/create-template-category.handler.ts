import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { TemplateCategory } from '../../../../domain/aggregates/template-category/template-category.aggregate';

import type { TemplateCategoryRepository } from '../../../../domain/repositories/template-category.repository';

import { TemplateCategoryResponseDto } from '../../../dto/template-category/template-category.response.dto';

import { CreateTemplateCategoryCommand } from './create-template-category.command';

@Injectable()
export class CreateTemplateCategoryHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.TemplateCategoryRepository)
    private readonly templateCategoryRepository: TemplateCategoryRepository,
  ) {}

  async execute(
    command: CreateTemplateCategoryCommand,
  ): Promise<TemplateCategoryResponseDto> {
    // 1. Tạo Aggregate
    const category = TemplateCategory.create({
      name: command.name,
      slug: command.slug,
      description: command.description,
      sortOrder: command.sortOrder,
    });

    // 2. Kiểm tra Slug trùng
    const exists = await this.templateCategoryRepository.existsBySlug(
      category.getSlug(),
    );

    if (exists) {
      throw new ConflictException('Template category slug already exists');
    }

    // 3. Lưu Category
    const savedCategory =
      await this.templateCategoryRepository.create(category);

    // 4. Trả về Response DTO
    return TemplateCategoryResponseDto.fromDomain(savedCategory);
  }
}
