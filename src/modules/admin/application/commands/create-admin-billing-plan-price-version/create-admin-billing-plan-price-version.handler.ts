import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminBillingPlanDetailResponseDto } from '../../dto/response/admin-billing-plan-detail.response.dto';
import type { AdminBillingPlanReader } from '../../ports/admin-billing-plan-reader.port';
import type { AdminBillingPlanWriter } from '../../ports/admin-billing-plan-writer.port';
import { CreateAdminBillingPlanPriceVersionCommand } from './create-admin-billing-plan-price-version.command';

@Injectable()
export class CreateAdminBillingPlanPriceVersionHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.BillingPlanReader)
    private readonly billingPlanReader: AdminBillingPlanReader,

    @Inject(ADMIN_TYPES.ports.BillingPlanWriter)
    private readonly billingPlanWriter: AdminBillingPlanWriter,
  ) {}

  async execute(
    command: CreateAdminBillingPlanPriceVersionCommand,
  ): Promise<AdminBillingPlanDetailResponseDto> {
    const currentPlan = await this.billingPlanReader.getPlanById(
      command.planId,
    );

    if (!currentPlan) {
      throw new NotFoundException('Billing plan not found');
    }

    const currentPrice = currentPlan.prices.find(
      (price) => price.id === command.priceId,
    );

    if (!currentPrice) {
      throw new NotFoundException('Billing plan price not found');
    }

    if (!currentPrice.isActive) {
      throw new BadRequestException(
        'Only an active billing plan price can be replaced',
      );
    }

    if (!Number.isSafeInteger(command.amount) || command.amount <= 0) {
      throw new BadRequestException(
        'Billing plan price amount must be a positive integer',
      );
    }

    if (command.amount === currentPrice.amount) {
      throw new BadRequestException(
        'New billing plan price must be different from the current price',
      );
    }

    const created = await this.billingPlanWriter.createPriceVersion({
      planId: currentPlan.id,
      priceId: currentPrice.id,
      amount: command.amount,
    });

    if (!created) {
      throw new ConflictException('Billing plan price is no longer active');
    }

    const updatedPlan = await this.billingPlanReader.getPlanById(
      currentPlan.id,
    );

    if (!updatedPlan) {
      throw new NotFoundException('Billing plan not found');
    }

    return new AdminBillingPlanDetailResponseDto(updatedPlan);
  }
}
