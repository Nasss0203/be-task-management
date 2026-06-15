import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';
import { Repository } from 'typeorm';
import { WorkspacePlanResponseDto } from '../../dto/response/dashboard/workspace-plan.response.dto';
import { AdminWorkspacePlanRepository } from '../../interfaces/repositories/dashboard/admin-workspace-plan.repository.interface';

type WorkspacePlanRaw = {
  id: string;
  name: string;
};

@Injectable()
export class AdminWorkspacePlanRepositoryImpl implements AdminWorkspacePlanRepository {
  constructor(
    @InjectRepository(Workspace)
    private readonly repo: Repository<Workspace>,
  ) {}

  async getWorkspacePlan(): Promise<WorkspacePlanResponseDto[]> {
    const rows = await this.repo
      .createQueryBuilder('workspace')
      .leftJoin(
        'subscription_workspaces',
        'subscription_workspace',
        'subscription_workspace.workspace_id = workspace.id',
      )
      .leftJoin(
        'subscriptions',
        'subscription',
        `subscription.id = subscription_workspace.subscription_id
          AND subscription.status IN (:...activeSubscriptionStatuses)
          AND (
            subscription.current_period_end IS NULL
            OR subscription.current_period_end >= :now
          )`,
        {
          activeSubscriptionStatuses: ['ACTIVE', 'TRIALING'],
          now: new Date(),
        },
      )
      .leftJoin(
        'plans',
        'activePlan',
        'activePlan.id = subscription.plan_id AND activePlan.is_active = true',
      )
      .select('workspace.id', 'id')
      .addSelect(
        `CASE
          WHEN MAX("activePlan"."slug") IS NULL THEN "workspace"."plan_type"
          WHEN MAX("activePlan"."slug") = 'free' THEN 'free'
          ELSE 'pro'
        END`,
        'name',
      )
      .where(`workspace.deleted_at IS NULL`)
      .groupBy(`workspace.id`)
      .getRawMany<WorkspacePlanRaw>();

    const rowMap = rows.reduce(
      (acc, row) => {
        const key = row.name.toLowerCase();
        acc.set(key, (acc.get(key) ?? 0) + 1);
        return acc;
      },
      new Map<string, number>(),
    );

    return [
      {
        name: 'Free',
        value: rowMap.get('free') ?? 0,
      },
      {
        name: 'Pro',
        value: rowMap.get('pro') ?? 0,
      },
    ];
  }
}
