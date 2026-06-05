import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PageModel } from '../domain/models/page.model';
import { UpdatePageDto } from '../dto/update-page.dto';
import { type FindPageRepository } from '../interfaces/repositories/find-page.repository.interface';
import {
  type UpdatePageInput,
  type UpdatePageRepository,
} from '../interfaces/repositories/update-page.repository.interface';
import { type UpdatePageService } from '../interfaces/services/update-page.service.interface';
import { PAGE_TYPES } from '../interfaces/types';

@Injectable()
export class UpdatePageServiceImpl implements UpdatePageService {
  constructor(
    @Inject(PAGE_TYPES.repositories.UpdatePageRepository)
    private readonly updatePageRepository: UpdatePageRepository,

    @Inject(PAGE_TYPES.repositories.FindPageRepository)
    private readonly findPageRepository: FindPageRepository,
  ) {}

  async update(
    pageId: string,
    dto: UpdatePageDto,
    manager?: EntityManager,
  ): Promise<PageModel> {
    await this.findPageRepository.findPageById(pageId, manager);

    const payload: UpdatePageInput = {
      id: pageId,
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.slug !== undefined && { slug: dto.slug }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      ...(dto.cover_url !== undefined && { cover_url: dto.cover_url }),
    };

    return this.updatePageRepository.save(payload, manager);
  }
}
