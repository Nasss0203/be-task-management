import type { AdminActionActor } from '../../domain/audit/admin-action';

export interface DisableAdminPublishedSiteInput {
  siteId: string;
  reason: string;
  actor: AdminActionActor;
}

export interface RestoreAdminPublishedSiteInput {
  siteId: string;
  actor: AdminActionActor;
}

export interface AdminPublishedSiteModerationResult {
  id: string;
  disabledAt: Date | null;
  moderation: {
    disabledAt: Date;
    disabledBy: string | null;
    reason: string | null;
  } | null;
}

export type AdminPublishedSiteModerationOutcome =
  | { kind: 'NOT_FOUND' }
  | { kind: 'UNCHANGED' }
  | { kind: 'DONE'; site: AdminPublishedSiteModerationResult };

export interface AdminPublishedSiteWriter {
  disableSite(
    input: DisableAdminPublishedSiteInput,
  ): Promise<AdminPublishedSiteModerationOutcome>;

  restoreSite(
    input: RestoreAdminPublishedSiteInput,
  ): Promise<AdminPublishedSiteModerationOutcome>;
}
