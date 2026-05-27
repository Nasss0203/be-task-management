import {
  BillingProvider,
  Subscription,
  SubscriptionStatus,
} from '../domain/entities/subscription.entity';
import { SubscriptionModel } from '../domain/models/subscription.model';
import { SubscriptionResponseDto } from '../dto/response/subscription.response.dto';

export type SaveSubscriptionInput = {
  id?: string;
  userId: string;
  planId: string;
  provider?: BillingProvider;
  providerSubscriptionId?: string | null;
  status?: SubscriptionStatus;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  trialEnd?: Date | null;
  cancelAtPeriodEnd?: boolean;
  cancelledAt?: Date | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export class SubscriptionMapper {
  static toModel(entity: Subscription): SubscriptionModel {
    return new SubscriptionModel(
      entity.id,
      entity.userId,
      entity.planId,
      entity.provider,
      entity.providerSubscriptionId ?? null,
      entity.status,
      entity.currentPeriodStart ?? null,
      entity.currentPeriodEnd ?? null,
      entity.trialEnd ?? null,
      entity.cancelAtPeriodEnd,
      entity.cancelledAt ?? null,
      entity.metadata ?? null,
      entity.createdAt,
      entity.updatedAt,
      entity.user?.email ?? null,
      entity.user?.username ?? null,
      entity.plan?.name ?? null,
      entity.plan?.slug ?? null,
    );
  }

  static toEntity(
    model: SubscriptionModel | SaveSubscriptionInput,
  ): Subscription {
    const e = new Subscription();

    if ('id' in model && model.id != null) {
      e.id = model.id;
    }

    e.userId = model.userId;
    e.planId = model.planId;
    e.provider = model.provider ?? BillingProvider.MANUAL;
    e.providerSubscriptionId = model.providerSubscriptionId ?? null;
    e.status = model.status ?? SubscriptionStatus.ACTIVE;
    e.currentPeriodStart = model.currentPeriodStart ?? null;
    e.currentPeriodEnd = model.currentPeriodEnd ?? null;
    e.trialEnd = model.trialEnd ?? null;
    e.cancelAtPeriodEnd = model.cancelAtPeriodEnd ?? false;
    e.cancelledAt = model.cancelledAt ?? null;
    e.metadata = model.metadata ?? null;

    if ('createdAt' in model && model.createdAt != null) {
      e.createdAt = model.createdAt;
    }

    if ('updatedAt' in model && model.updatedAt != null) {
      e.updatedAt = model.updatedAt;
    }

    return e;
  }

  static toResponse(model: SubscriptionModel): SubscriptionResponseDto {
    return {
      id: model.id,
      userId: model.userId,
      planId: model.planId,
      provider: model.provider,
      providerSubscriptionId: model.providerSubscriptionId,
      status: model.status,
      currentPeriodStart: model.currentPeriodStart,
      currentPeriodEnd: model.currentPeriodEnd,
      trialEnd: model.trialEnd,
      cancelAtPeriodEnd: model.cancelAtPeriodEnd,
      cancelledAt: model.cancelledAt,
      metadata: model.metadata,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      userEmail: model.userEmail,
      username: model.username,
      planName: model.planName,
      planSlug: model.planSlug,
    };
  }

  static toResponseList(
    models: SubscriptionModel[],
  ): SubscriptionResponseDto[] {
    return models.map((item) => this.toResponse(item));
  }
}
