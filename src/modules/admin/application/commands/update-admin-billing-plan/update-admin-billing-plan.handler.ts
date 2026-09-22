import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { BillingFeatureValueType } from 'src/modules/billing/domain/constants/billing-feature-value-type.constant';

import { ADMIN_TYPES } from '../../../admin.types';
import { AdminBillingPlanDetailResponseDto } from '../../dto/response/admin-billing-plan-detail.response.dto';
import type {
  AdminBillingPlanFeatureSummary,
  AdminBillingPlanReader,
} from '../../ports/admin-billing-plan-reader.port';
import type {
  AdminBillingPlanWriter,
  UpdateAdminBillingPlanFeatureInput,
} from '../../ports/admin-billing-plan-writer.port';
import {
  UpdateAdminBillingPlanCommand,
  type UpdateAdminBillingPlanFeatureCommandItem,
} from './update-admin-billing-plan.command';

@Injectable()
export class UpdateAdminBillingPlanHandler {
  constructor(
    @Inject(ADMIN_TYPES.ports.BillingPlanReader)
    private readonly billingPlanReader: AdminBillingPlanReader,

    @Inject(ADMIN_TYPES.ports.BillingPlanWriter)
    private readonly billingPlanWriter: AdminBillingPlanWriter,
  ) {}

  async execute(
    command: UpdateAdminBillingPlanCommand,
  ): Promise<AdminBillingPlanDetailResponseDto> {
    this.ensureRequestHasChanges(command);

    const currentPlan = await this.billingPlanReader.getPlanById(
      command.planId,
    );

    if (!currentPlan) {
      throw new NotFoundException('Billing plan not found');
    }

    const name =
      command.name === undefined ? currentPlan.name : command.name.trim();

    if (!name) {
      throw new BadRequestException('Billing plan name cannot be empty');
    }

    const description =
      command.description === undefined
        ? currentPlan.description
        : this.normalizeDescription(command.description);

    const features = this.normalizeFeatures(
      command.features ?? [],
      currentPlan.features,
    );

    const updated = await this.billingPlanWriter.updatePlan({
      planId: currentPlan.id,
      name,
      description,
      isActive: command.isActive ?? currentPlan.isActive,
      isPublic: command.isPublic ?? currentPlan.isPublic,
      features,
    });

    if (!updated) {
      throw new NotFoundException('Billing plan not found');
    }

    const updatedPlan = await this.billingPlanReader.getPlanById(
      currentPlan.id,
    );

    if (!updatedPlan) {
      throw new NotFoundException('Billing plan not found');
    }

    return new AdminBillingPlanDetailResponseDto(updatedPlan);
  }

  private ensureRequestHasChanges(
    command: UpdateAdminBillingPlanCommand,
  ): void {
    const hasMetadataChange =
      command.name !== undefined ||
      command.description !== undefined ||
      command.isActive !== undefined ||
      command.isPublic !== undefined;

    const hasFeatureChange = (command.features?.length ?? 0) > 0;

    if (!hasMetadataChange && !hasFeatureChange) {
      throw new BadRequestException(
        'At least one billing plan field must be provided',
      );
    }
  }

  private normalizeDescription(description: string | null): string | null {
    if (description === null) {
      return null;
    }

    const normalized = description.trim();

    return normalized.length === 0 ? null : normalized;
  }

  private normalizeFeatures(
    updates: readonly UpdateAdminBillingPlanFeatureCommandItem[],
    definitions: readonly AdminBillingPlanFeatureSummary[],
  ): UpdateAdminBillingPlanFeatureInput[] {
    const definitionsById = new Map(
      definitions.map((feature) => [feature.id, feature]),
    );

    const usedFeatureIds = new Set<string>();

    return updates.map((update) => {
      if (usedFeatureIds.has(update.featureId)) {
        throw new BadRequestException(
          `Duplicate billing feature: ${update.featureId}`,
        );
      }

      usedFeatureIds.add(update.featureId);

      const definition = definitionsById.get(update.featureId);

      if (!definition) {
        throw new BadRequestException(
          `Billing feature not found: ${update.featureId}`,
        );
      }

      return {
        featureId: update.featureId,
        value: this.normalizeFeatureValue(definition, update.value),
      };
    });
  }

  private normalizeFeatureValue(
    feature: AdminBillingPlanFeatureSummary,
    value: boolean | number | string,
  ): boolean | number | string {
    switch (feature.valueType) {
      case BillingFeatureValueType.BOOLEAN:
        if (typeof value !== 'boolean') {
          throw new BadRequestException(`${feature.code} must be a boolean`);
        }

        return value;

      case BillingFeatureValueType.NUMBER:
        if (
          typeof value !== 'number' ||
          !Number.isSafeInteger(value) ||
          value < 0
        ) {
          throw new BadRequestException(
            `${feature.code} must be a non-negative integer`,
          );
        }

        return value;

      case BillingFeatureValueType.STRING: {
        if (typeof value !== 'string') {
          throw new BadRequestException(`${feature.code} must be a string`);
        }

        const normalized = value.trim();

        if (!normalized) {
          throw new BadRequestException(`${feature.code} cannot be empty`);
        }

        if (normalized.length > 1000) {
          throw new BadRequestException(
            `${feature.code} cannot exceed 1000 characters`,
          );
        }

        return normalized;
      }

      default:
        throw new BadRequestException(
          `Unsupported value type for ${feature.code}`,
        );
    }
  }
}
