import { Inject, Injectable } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminTemplateListResponseDto } from '../../dto/response/admin-template-list.response.dto';
import type { AdminTemplateReader } from '../../ports/admin-template-reader.port';
import { ListAdminTemplatesQuery } from './list-admin-templates.query';

@Injectable()
export class ListAdminTemplatesHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.TemplateReader)
    private readonly templateReader: AdminTemplateReader,
  ) {}

  async execute(
    query: ListAdminTemplatesQuery,
  ): Promise<AdminTemplateListResponseDto> {
    const result = await this.templateReader.listTemplates({
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
      offerType: query.offerType,
      categoryId: query.categoryId,
    });

    return {
      items: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages:
        result.total === 0 ? 0 : Math.ceil(result.total / result.limit),
    };
  }
}
