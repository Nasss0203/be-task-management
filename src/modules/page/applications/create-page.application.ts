import { Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { CreatePageDto } from '../dto/create-page.dto';
import { PageResponseDto } from '../dto/response/page.response.dto';
import { type CreatePageApplication } from '../interfaces/applications/create-page.application.interface';
import { type CreatePageService } from '../interfaces/services/create.page.service.interface';
import { PAGE_TYPES } from '../interfaces/types';
import { PageMapper } from '../mapper/page.mapper';

@Injectable()
export class CreatePageApplicationImpl implements CreatePageApplication {
  constructor(
    @Inject(PAGE_TYPES.services.CreatePageService)
    private readonly createPageService: CreatePageService,

    @Inject(PAGE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  async create(dto: CreatePageDto): Promise<PageResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      const page = await this.createPageService.create(dto, manager);

      return PageMapper.toResponse(page);
    });
  }
}
