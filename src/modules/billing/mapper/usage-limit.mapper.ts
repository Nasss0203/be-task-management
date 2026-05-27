import {
  UsageLimit,
  UsageResourceType,
} from '../domain/entities/usage-limit.entity';
import { UsageLimitModel } from '../domain/models/usage-limit.model';
import { UsageLimitResponseDto } from '../dto/response/usage-limit.response.dto';

export type SaveUsageLimitInput = {
  id?: string;
  workspaceId: string;
  planId?: string | null;
  resourceType: UsageResourceType;
  limitValue?: number | null;
  usedValue?: number;
  resetAt?: Date | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export class UsageLimitMapper {
  static toModel(entity: UsageLimit): UsageLimitModel {
    return new UsageLimitModel(
      entity.id,
      entity.workspaceId,
      entity.planId ?? null,
      entity.resourceType,
      entity.limitValue ?? null,
      entity.usedValue,
      entity.resetAt ?? null,
      entity.metadata ?? null,
      entity.createdAt,
      entity.updatedAt,
      entity.workspace?.name ?? null,
      entity.workspace?.slug ?? null,
      entity.plan?.name ?? null,
      entity.plan?.slug ?? null,
    );
  }

  static toEntity(model: UsageLimitModel | SaveUsageLimitInput): UsageLimit {
    const e = new UsageLimit();

    if ('id' in model && model.id != null) {
      e.id = model.id;
    }

    e.workspaceId = model.workspaceId;
    e.planId = model.planId ?? null;
    e.resourceType = model.resourceType;
    e.limitValue = model.limitValue ?? null;
    e.usedValue = model.usedValue ?? 0;
    e.resetAt = model.resetAt ?? null;
    e.metadata = model.metadata ?? null;

    if ('createdAt' in model && model.createdAt != null) {
      e.createdAt = model.createdAt;
    }

    if ('updatedAt' in model && model.updatedAt != null) {
      e.updatedAt = model.updatedAt;
    }

    return e;
  }

  static toResponse(model: UsageLimitModel): UsageLimitResponseDto {
    return {
      id: model.id,
      workspaceId: model.workspaceId,
      planId: model.planId,
      resourceType: model.resourceType,
      limitValue: model.limitValue,
      usedValue: model.usedValue,
      resetAt: model.resetAt,
      metadata: model.metadata,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      workspaceName: model.workspaceName,
      workspaceSlug: model.workspaceSlug,
      planName: model.planName,
      planSlug: model.planSlug,
    };
  }

  static toResponseList(models: UsageLimitModel[]): UsageLimitResponseDto[] {
    return models.map((item) => this.toResponse(item));
  }
}
