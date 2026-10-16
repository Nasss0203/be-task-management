import { MARKETPLACE_TYPES } from 'src/modules/marketplace/marketplace.types';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { TemplateCategoryRepository } from '../../../../domain/repositories/template-category.repository';

import { TemplateCategoryResponseDto } from '../../../dto/template-category/template-category.response.dto';

import { ChangeTemplateCategoryStatusCommand } from './change-template-category-status.command';

@Injectable()
export class ChangeTemplateCategoryStatusHandler {
  constructor(
    @Inject(MARKETPLACE_TYPES.repositories.TemplateCategoryRepository)
    private readonly templateCategoryRepository: TemplateCategoryRepository,
  ) {}

  async execute(
    command: ChangeTemplateCategoryStatusCommand,
  ): Promise<TemplateCategoryResponseDto> {
    // 1. Tìm Category
    const category = await this.templateCategoryRepository.findById(
      command.categoryId,
    );

    if (!category) {
      throw new NotFoundException('Template category not found');
    }

    // 2. Thay đổi trạng thái
    if (command.isActive) {
      category.activate();
    } else {
      category.deactivate();
    }

    // 3. Lưu thay đổi
    const savedCategory = await this.templateCategoryRepository.save(category);

    // 4. Trả về DTO
    return TemplateCategoryResponseDto.fromDomain(savedCategory);
  }
}
