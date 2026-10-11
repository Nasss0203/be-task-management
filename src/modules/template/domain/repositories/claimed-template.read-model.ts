import type { TemplateEntitlementSource } from '../enums/template-entitlement-source.enum';
import type { TemplateListingStatus } from '../enums/template-listing-status.enum';
import type { TemplateStatus } from '../enums/template-status.enum';
import type { TemplateVisibility } from '../enums/template-visibility.enum';
import type { TemplateVersionStatus } from '../enums/template-version-status.enum';

export type ClaimedTemplateReadModel = {
  entitlementId: string;
  templateId: string;
  source: TemplateEntitlementSource;
  claimedAt: Date;
  // Non-public metadata is deliberately redacted in this entitlement library.
  name: string | null;
  description: string | null;
  icon: string | null;
  coverUrl: string | null;
  visibility: TemplateVisibility;
  status: TemplateStatus;
  listingStatus: TemplateListingStatus | null;
  publishedVersion: {
    id: string;
    templateId: string;
    versionNumber: number;
    status: TemplateVersionStatus;
    publishedAt: Date | null;
  } | null;
};

export type FindClaimedTemplatesFilters = {
  userId: string;
  limit: number;
  cursor?: { createdAt: Date; id: string };
};

export type FindClaimedTemplatesResult = {
  items: ClaimedTemplateReadModel[];
  hasNextPage: boolean;
};
