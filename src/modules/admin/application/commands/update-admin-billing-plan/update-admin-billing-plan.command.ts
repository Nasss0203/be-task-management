import type { AdminActionActor } from '../../../domain/audit/admin-action';

export type UpdateAdminBillingPlanFeatureValue = boolean | number | string;

export interface UpdateAdminBillingPlanFeatureCommandItem {
  featureId: string;
  value: UpdateAdminBillingPlanFeatureValue;
}

export class UpdateAdminBillingPlanCommand {
  constructor(
    public readonly planId: string,
    public readonly name: string | undefined,
    public readonly description: string | null | undefined,
    public readonly isActive: boolean | undefined,
    public readonly isPublic: boolean | undefined,
    public readonly features:
      | UpdateAdminBillingPlanFeatureCommandItem[]
      | undefined,
    public readonly actor: AdminActionActor,
  ) {}
}
