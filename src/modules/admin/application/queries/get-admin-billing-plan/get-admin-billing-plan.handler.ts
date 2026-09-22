import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminBillingPlanDetailResponseDto } from '../../dto/response/admin-billing-plan-detail.response.dto';
import type { AdminBillingPlanReader } from '../../ports/admin-billing-plan-reader.port';
import { GetAdminBillingPlanQuery } from './get-admin-billing-plan.query';

@Injectable()
export class GetAdminBillingPlanHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.BillingPlanReader)
    private readonly billingPlanReader: AdminBillingPlanReader,
  ) {}

  async execute(
    query: GetAdminBillingPlanQuery,
  ): Promise<AdminBillingPlanDetailResponseDto> {
    const plan = await this.billingPlanReader.getPlanById(query.planId);

    if (!plan) {
      throw new NotFoundException('Billing plan not found');
    }

    return new AdminBillingPlanDetailResponseDto(plan);
  }
}
