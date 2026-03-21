import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { PageBlockModel } from '../domain/models/page_block.model';
import { CreatePageBlockDto } from '../dto/create-page_block.dto';
import { type CreatePageBlockRepository } from '../interfaces/repositories/create.page_block.repository.interface';
import { CreatePageBlockService } from '../interfaces/services/create.page_block.service.interface';
import { PAGE_BLOCK_TYPES } from '../interfaces/types';

@Injectable()
export class CreatePageBlockServiceImpl implements CreatePageBlockService {
  constructor(
    @Inject(PAGE_BLOCK_TYPES.repositories.CreatePageBlockRepository)
    private readonly repo: CreatePageBlockRepository,
  ) {}
  create(
    createPageBlockDto: CreatePageBlockDto,
    manager: EntityManager,
  ): Promise<PageBlockModel> {
    // Todo: Kiểm tra đã có page block đã tồn tại chưa. Nếu đã tồn tại sẽ đếm số lượng và tính toán
    const create = this.repo.save(createPageBlockDto, manager);
    return create;
  }
}
