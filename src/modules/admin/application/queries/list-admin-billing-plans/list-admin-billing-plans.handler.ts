import { Inject, Injectable } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminBillingPlanListResponseDto } from '../../dto/response/admin-billing-plan-list.response.dto';
import type { AdminBillingPlanReader } from '../../ports/admin-billing-plan-reader.port';
import { ListAdminBillingPlansQuery } from './list-admin-billing-plans.query';

@Injectable()
export class ListAdminBillingPlansHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.BillingPlanReader)
    private readonly billingPlanReader: AdminBillingPlanReader,
  ) {}

  async execute(
    query: ListAdminBillingPlansQuery,
  ): Promise<AdminBillingPlanListResponseDto> {
    const result = await this.billingPlanReader.listPlans({
      page: query.page,
      limit: query.limit,
      search: query.search,
      isActive: query.isActive,
      isPublic: query.isPublic,
      provider: query.provider,
      billingInterval: query.billingInterval,
    });

    return new AdminBillingPlanListResponseDto(result);
  }
}
