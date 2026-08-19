import { Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { PageResponseDto } from '../dto/response/page.response.dto';
import { UpdatePageDto } from '../dto/update-page.dto';
import { type UpdatePageApplication } from '../interfaces/applications/update-page.application.interface';
import { type UpdatePageService } from '../interfaces/services/update-page.service.interface';
import { PAGE_TYPES } from '../interfaces/types';
import { PageMapper } from '../mapper/page.mapper';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';

@Injectable()
export class UpdatePageApplicationImpl implements UpdatePageApplication {
  constructor(
    @Inject(PAGE_TYPES.services.UpdatePageService)
    private readonly updatePageService: UpdatePageService,

    @Inject(PERSISTENCE_TYPES.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}

  update(pageId: string, dto: UpdatePageDto): Promise<PageResponseDto> {
    return this.uow.runInTransaction(async (manager) => {
      const page = await this.updatePageService.update(pageId, dto, manager);

      return PageMapper.toResponse(page);
    });
  }
}
