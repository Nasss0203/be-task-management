import { Inject, Injectable } from '@nestjs/common';
import { PageResponseDto } from '../dto/response/page.response.dto';
import { type FindPageApplication } from '../interfaces/applications/find-page.application.interface';
import { type FindPageService } from '../interfaces/services/find-page.service.interface';
import { PAGE_TYPES } from '../interfaces/types';
import { PageMapper } from '../mapper/page.mapper';

@Injectable()
export class FindPageApplicationImpl implements FindPageApplication {
  constructor(
    @Inject(PAGE_TYPES.services.FindPageService)
    private readonly findPageService: FindPageService,
  ) {}

  async findPageByWorkspaceId(
    userId: string,
    workspaceId: string,
  ): Promise<PageResponseDto | null> {
    const pages = await this.findPageService.findPageByWorkspaceId(
      userId,
      workspaceId,
    );

    return PageMapper.toResponse(pages);
  }
}
