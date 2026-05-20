import { SubscriptionWorkspace } from '../domain/entities/subscription-workspace.entity';
import { SubscriptionWorkspaceModel } from '../domain/models/subscription-workspace.model';
import { SubscriptionWorkspaceResponseDto } from '../dto/response/subscription-workspace.response.dto';

export type SaveSubscriptionWorkspaceInput = {
  id?: string;
  subscriptionId: string;
  workspaceId: string;
  activatedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export class SubscriptionWorkspaceMapper {
  static toModel(entity: SubscriptionWorkspace): SubscriptionWorkspaceModel {
    return new SubscriptionWorkspaceModel(
      entity.id,
      entity.subscriptionId,
      entity.workspaceId,
      entity.activatedAt ?? null,
      entity.createdAt,
      entity.updatedAt,
      entity.subscription?.status ?? null,
      entity.subscription?.planId ?? null,
      entity.workspace?.name ?? null,
      entity.workspace?.slug ?? null,
    );
  }

  static toEntity(
    model: SubscriptionWorkspaceModel | SaveSubscriptionWorkspaceInput,
  ): SubscriptionWorkspace {
    const e = new SubscriptionWorkspace();

    if ('id' in model && model.id != null) {
      e.id = model.id;
    }

    e.subscriptionId = model.subscriptionId;
    e.workspaceId = model.workspaceId;
    e.activatedAt = model.activatedAt ?? null;

    if ('createdAt' in model && model.createdAt != null) {
      e.createdAt = model.createdAt;
    }

    if ('updatedAt' in model && model.updatedAt != null) {
      e.updatedAt = model.updatedAt;
    }

    return e;
  }

  static toResponse(
    model: SubscriptionWorkspaceModel,
  ): SubscriptionWorkspaceResponseDto {
    return {
      id: model.id,
      subscriptionId: model.subscriptionId,
      workspaceId: model.workspaceId,
      activatedAt: model.activatedAt,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      subscriptionStatus: model.subscriptionStatus,
      subscriptionPlanId: model.subscriptionPlanId,
      workspaceName: model.workspaceName,
      workspaceSlug: model.workspaceSlug,
    };
  }

  static toResponseList(
    models: SubscriptionWorkspaceModel[],
  ): SubscriptionWorkspaceResponseDto[] {
    return models.map((item) => this.toResponse(item));
  }
}
