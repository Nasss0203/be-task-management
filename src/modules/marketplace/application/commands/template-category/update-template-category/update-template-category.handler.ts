import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { TemplateCategoryRepository } from '../../../../domain/repositories/template-category.repository';

import { TemplateCategoryResponseDto } from '../../../dto/template-category/template-category.response.dto';

import { UpdateTemplateCategoryCommand } from './update-template-category.command';

@Injectable()
export class UpdateTemplateCategoryHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.TemplateCategoryRepository)
    private readonly templateCategoryRepository: TemplateCategoryRepository,
  ) {}

  async execute(
    command: UpdateTemplateCategoryCommand,
  ): Promise<TemplateCategoryResponseDto> {
    // 1. Kiểm tra có dữ liệu cần cập nhật
    if (
      command.name === undefined &&
      command.slug === undefined &&
      command.description === undefined &&
      command.sortOrder === undefined
    ) {
      throw new BadRequestException('At least one field must be provided');
    }

    // 2. Tìm Category
    const category = await this.templateCategoryRepository.findById(
      command.categoryId,
    );

    if (!category) {
      throw new NotFoundException('Template category not found');
    }

    // 3. Cập nhật Domain Aggregate
    category.updateDetails({
      name: command.name,
      slug: command.slug,
      description: command.description,
      sortOrder: command.sortOrder,
    });

    // 4. Kiểm tra Slug có bị trùng không
    const exists = await this.templateCategoryRepository.existsBySlug(
      category.getSlug(),
      category.getId(),
    );

    if (exists) {
      throw new ConflictException('Template category slug already exists');
    }

    // 5. Lưu Category
    const savedCategory = await this.templateCategoryRepository.save(category);

    // 6. Trả về DTO
    return TemplateCategoryResponseDto.fromDomain(savedCategory);
  }
}
