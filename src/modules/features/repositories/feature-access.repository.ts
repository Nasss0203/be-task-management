import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FeatureKey } from '../constants/feature-key.constant';
import { FeatureAccessRepository } from '../interfaces/repositories/feature-access.repository.interface';

type FeatureAccessRow = {
  enabled: boolean;
};

@Injectable()
export class FeatureAccessRepositoryImpl implements FeatureAccessRepository {
  constructor(private readonly dataSource: DataSource) {}

  async existsUserWorkspaceMembership(
    userId: string,
    workspaceId: string,
  ): Promise<boolean> {
    const rows = await this.dataSource.query(
      `
        SELECT 1
        FROM user_workspaces
        WHERE user_id = $1
          AND workspace_id = $2
        LIMIT 1
      `,
      [userId, workspaceId],
    );

    return Boolean(rows?.[0]);
  }

  async isFeatureEnabledForWorkspace(
    workspaceId: string,
    featureKey: FeatureKey | string,
  ): Promise<boolean> {
    const normalizedFeatureKey = String(featureKey).trim().toLowerCase();

    const rows = await this.dataSource.query<FeatureAccessRow[]>(
      `
        WITH active_workspace_plan AS (
          SELECT p.id AS "planId"
          FROM subscription_workspaces sw
          INNER JOIN subscriptions s ON s.id = sw.subscription_id
          INNER JOIN plans p ON p.id = s.plan_id
          WHERE sw.workspace_id = $1
            AND s.status IN ('ACTIVE', 'TRIALING')
            AND (s.current_period_end IS NULL OR s.current_period_end > NOW())
            AND p.is_active = true
            AND p.deleted_at IS NULL
          ORDER BY sw.activated_at DESC NULLS LAST, sw.created_at DESC
          LIMIT 1
        ),
        fallback_workspace_plan AS (
          SELECT p.id AS "planId"
          FROM workspaces w
          INNER JOIN plans p
            ON p.slug = CASE
              WHEN w.plan_type::text = 'pro' THEN 'pro-monthly'
              ELSE w.plan_type::text
            END
          WHERE w.id = $1
            AND w.deleted_at IS NULL
            AND p.is_active = true
            AND p.deleted_at IS NULL
          LIMIT 1
        ),
        selected_plan AS (
          SELECT "planId" FROM active_workspace_plan
          UNION ALL
          SELECT "planId" FROM fallback_workspace_plan
          WHERE NOT EXISTS (SELECT 1 FROM active_workspace_plan)
          LIMIT 1
        )
        SELECT pf.enabled AS "enabled"
        FROM selected_plan sp
        INNER JOIN features f ON LOWER(f.code) = $2
        INNER JOIN plan_features pf
          ON pf.plan_id = sp."planId"
          AND pf.feature_id = f.id
        LEFT JOIN workspace_feature_settings wfs
          ON wfs.workspace_id = $1
          AND wfs.feature_id = f.id
          AND wfs.deleted_at IS NULL
        WHERE f.is_active = true
          AND f.deleted_at IS NULL
          AND pf.enabled = true
          AND pf.deleted_at IS NULL
          AND COALESCE(wfs.enabled, true) = true
        LIMIT 1
      `,
      [workspaceId, normalizedFeatureKey],
    );

    return rows?.[0]?.enabled === true;
  }
}
