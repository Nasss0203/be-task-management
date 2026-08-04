import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WorkspaceFeatureStatusModel } from '../domain/models/workspace_feature_status.model';
import { WorkspaceFeatureAccessRepository } from '../interfaces/repositories/workspace_feature_access.repository.interface';

type WorkspaceFeatureRow = {
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  planEnabled: boolean;
  workspaceEnabled: boolean | null;
  enabled: boolean;
  metadata: Record<string, unknown> | null;
};

type FeatureIdRow = {
  featureId: string;
};

@Injectable()
export class WorkspaceFeatureAccessRepositoryImpl implements WorkspaceFeatureAccessRepository {
  constructor(private readonly dataSource: DataSource) {}

  async findWorkspaceFeatures(
    workspaceId: string,
  ): Promise<WorkspaceFeatureStatusModel[]> {
    const rows = await this.dataSource.query<WorkspaceFeatureRow[]>(
      this.workspaceFeatureStatusQuery(),
      [workspaceId],
    );

    return rows.map((row) => this.toModel(row));
  }

  async findWorkspaceFeatureByCode(
    workspaceId: string,
    featureCode: string,
  ): Promise<WorkspaceFeatureStatusModel | null> {
    const rows = await this.dataSource.query<WorkspaceFeatureRow[]>(
      `
        ${this.workspaceFeatureStatusQuery()}
        AND LOWER(f.code) = $2
        LIMIT 1
      `,
      [workspaceId, this.normalizeFeatureCode(featureCode)],
    );

    return rows?.[0] ? this.toModel(rows[0]) : null;
  }

  async upsertWorkspaceFeatureSetting(input: {
    workspaceId: string;
    featureCode: string;
    enabled: boolean;
    userId: string;
  }): Promise<WorkspaceFeatureStatusModel> {
    const featureId = await this.findPlanEnabledFeatureId(
      input.workspaceId,
      input.featureCode,
    );

    await this.dataSource.query(
      `
        INSERT INTO workspace_feature_settings (
          workspace_id,
          feature_id,
          enabled,
          created_by,
          updated_by,
          metadata,
          deleted_at
        )
        VALUES ($1, $2, $3, $4, $4, NULL, NULL)
        ON CONFLICT (workspace_id, feature_id)
        DO UPDATE SET
          enabled = EXCLUDED.enabled,
          updated_by = EXCLUDED.updated_by,
          deleted_at = NULL,
          updated_at = NOW()
      `,
      [input.workspaceId, featureId, input.enabled, input.userId],
    );

    const updated = await this.findWorkspaceFeatureByCode(
      input.workspaceId,
      input.featureCode,
    );

    if (!updated) {
      throw new Error('Workspace feature setting upsert failed');
    }

    return updated;
  }

  private async findPlanEnabledFeatureId(
    workspaceId: string,
    featureCode: string,
  ): Promise<string> {
    const rows = await this.dataSource.query<FeatureIdRow[]>(
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
        SELECT f.id AS "featureId"
        FROM selected_plan sp
        INNER JOIN features f ON LOWER(f.code) = $2
        INNER JOIN plan_features pf
          ON pf.plan_id = sp."planId"
          AND pf.feature_id = f.id
        WHERE f.is_active = true
          AND f.deleted_at IS NULL
          AND pf.enabled = true
          AND pf.deleted_at IS NULL
        LIMIT 1
      `,
      [workspaceId, this.normalizeFeatureCode(featureCode)],
    );

    if (!rows?.[0]?.featureId) {
      throw new Error('Feature is not available for current plan');
    }

    return rows[0].featureId;
  }

  private workspaceFeatureStatusQuery(): string {
    return `
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
      SELECT
        f.code AS "code",
        f.name AS "name",
        f.description AS "description",
        f.category AS "category",
        pf.enabled AS "planEnabled",
        wfs.enabled AS "workspaceEnabled",
        (pf.enabled = true AND COALESCE(wfs.enabled, true) = true) AS "enabled",
        f.metadata AS "metadata"
      FROM selected_plan sp
      INNER JOIN plan_features pf
        ON pf.plan_id = sp."planId"
        AND pf.deleted_at IS NULL
      INNER JOIN features f
        ON f.id = pf.feature_id
        AND f.is_active = true
        AND f.deleted_at IS NULL
      LEFT JOIN workspace_feature_settings wfs
        ON wfs.workspace_id = $1
        AND wfs.feature_id = f.id
        AND wfs.deleted_at IS NULL
      WHERE 1 = 1
    `;
  }

  private normalizeFeatureCode(featureCode: string): string {
    return featureCode.trim().toLowerCase();
  }

  private toModel(row: WorkspaceFeatureRow): WorkspaceFeatureStatusModel {
    return new WorkspaceFeatureStatusModel(
      row.code,
      row.name,
      row.description,
      row.category,
      row.planEnabled,
      row.workspaceEnabled,
      row.enabled,
      row.metadata,
    );
  }
}
