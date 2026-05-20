import { Plan, PlanBillingInterval } from '../domain/entities/plan.entity';
import { PlanModel } from '../domain/models/plan.model';
import { PlanResponseDto } from '../dto/response/plan.response.dto';

export type SavePlanInput = {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  priceAmount?: number;
  currency?: string;
  billingInterval?: PlanBillingInterval;
  features?: Record<string, unknown> | null;
  limits?: Record<string, unknown> | null;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
};

export class PlanMapper {
  static toModel(entity: Plan): PlanModel {
    return new PlanModel(
      entity.id,
      entity.name,
      entity.slug,
      entity.description ?? null,
      entity.priceAmount,
      entity.currency,
      entity.billingInterval,
      entity.features ?? null,
      entity.limits ?? null,
      entity.isActive,
      entity.sortOrder,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt ?? null,
    );
  }

  static toEntity(model: PlanModel | SavePlanInput): Plan {
    const e = new Plan();

    if ('id' in model && model.id != null) {
      e.id = model.id;
    }

    e.name = model.name;
    e.slug = model.slug;
    e.description = model.description ?? null;
    e.priceAmount = model.priceAmount ?? 0;
    e.currency = model.currency ?? 'VND';
    e.billingInterval = model.billingInterval ?? PlanBillingInterval.MONTH;
    e.features = model.features ?? null;
    e.limits = model.limits ?? null;
    e.isActive = model.isActive ?? true;
    e.sortOrder = model.sortOrder ?? 0;

    if ('createdAt' in model && model.createdAt != null) {
      e.createdAt = model.createdAt;
    }

    if ('updatedAt' in model && model.updatedAt != null) {
      e.updatedAt = model.updatedAt;
    }

    if ('deletedAt' in model && model.deletedAt !== undefined) {
      e.deletedAt = model.deletedAt ?? null;
    }

    return e;
  }

  static toResponse(model: PlanModel): PlanResponseDto {
    return {
      id: model.id,
      name: model.name,
      slug: model.slug,
      description: model.description,
      priceAmount: model.priceAmount,
      currency: model.currency,
      billingInterval: model.billingInterval,
      features: model.features,
      limits: model.limits,
      isActive: model.isActive,
      sortOrder: model.sortOrder,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt,
    };
  }

  static toResponseList(models: PlanModel[]): PlanResponseDto[] {
    return models.map((item) => this.toResponse(item));
  }
}
