import { Inject, Injectable } from '@nestjs/common';
import { BILLING_TYPES } from '../../../../billing.types';
import type { BillingFeatureRepository } from '../../../../domain/repositories/billing-feature.repository';
import type { BillingPlanFeatureRepository } from '../../../../domain/repositories/billing-plan-feature.repository';
import type { BillingPlanPriceRepository } from '../../../../domain/repositories/billing-plan-price.repository';
import type { BillingPlanRepository } from '../../../../domain/repositories/billing-plan.repository';
import { BillingPlanListResponseDto } from '../../../dto/response/billing-plan-list.response.dto';
import { ListBillingPlansQuery } from './list-billing-plans.query';

@Injectable()
export class ListBillingPlansHandler {
  constructor(
    @Inject(BILLING_TYPES.repositories.BillingPlanRepository)
    private readonly billingPlanRepository: BillingPlanRepository,

    @Inject(BILLING_TYPES.repositories.BillingFeatureRepository)
    private readonly billingFeatureRepository: BillingFeatureRepository,

    @Inject(BILLING_TYPES.repositories.BillingPlanFeatureRepository)
    private readonly billingPlanFeatureRepository: BillingPlanFeatureRepository,

    @Inject(BILLING_TYPES.repositories.BillingPlanPriceRepository)
    private readonly billingPlanPriceRepository: BillingPlanPriceRepository,
  ) {}

  async execute(
    _query: ListBillingPlansQuery,
  ): Promise<BillingPlanListResponseDto> {
    const plans = await this.billingPlanRepository.findActivePublic();

    if (plans.length === 0) {
      return {
        items: [],
      };
    }

    const planIds = plans.map((plan) => plan.getId());

    const [features, planFeatures, planPrices] = await Promise.all([
      this.billingFeatureRepository.findAll(),
      this.billingPlanFeatureRepository.findByPlanIds(planIds),
      this.billingPlanPriceRepository.findActiveByPlanIds(planIds),
    ]);

    const featuresById = new Map(
      features.map((feature) => [feature.getId(), feature]),
    );

    return {
      items: plans.map((plan) => {
        const planId = plan.getId();

        const featureItems = planFeatures
          .filter((planFeature) => planFeature.getPlanId() === planId)
          .flatMap((planFeature) => {
            const feature = featuresById.get(planFeature.getFeatureId());

            if (!feature) {
              return [];
            }

            return [
              {
                id: planFeature.getId(),
                featureId: feature.getId(),
                code: feature.getCode(),
                name: feature.getName(),
                description: feature.getDescription(),
                valueType: feature.getValueType(),
                value: planFeature.getValue(),
              },
            ];
          })
          .sort((first, second) => first.code.localeCompare(second.code));

        const priceItems = planPrices
          .filter((price) => price.getPlanId() === planId)
          .map((price) => ({
            id: price.getId(),
            billingInterval: price.getBillingInterval(),
            currency: price.getCurrency(),
            amount: price.getAmount(),
            provider: price.getProvider(),
          }));

        return {
          id: planId,
          code: plan.getCode(),
          name: plan.getName(),
          description: plan.getDescription(),
          features: featureItems,
          prices: priceItems,
        };
      }),
    };
  }
}
