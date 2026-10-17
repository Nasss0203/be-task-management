import { TemplatePreviewResponseDto } from 'src/modules/template/application/dto/template-preview/template-preview.response.dto';

import type { TemplateListing } from '../../domain/aggregates/template-listing/template-listing.aggregate';
import { TemplateDemoConfig } from '../../domain/value-objects/template-demo-config.vo';
import {
  applyTemplateDemoFilter,
  assertDemoConfigMatchesSnapshot,
} from './template-demo-preview-filter';

/** The paid demo cannot be served; callers map this to 403. */
export class TemplateDemoPreviewUnavailableError extends Error {}

export type TemplateDemoPreviewPlan = {
  demoVersionId: string;
  /** Set only for LIMITED demos; null means the whole demo version is public. */
  config: TemplateDemoConfig | null;
};

/**
 * Decides which version a public visitor may see for a PAID listing.
 * Fails closed: a missing demo, an unreadable config, or a same-version demo
 * without a LIMITED config never falls back to the full paid snapshot.
 */
export function resolvePaidDemoPreviewPlan(
  listing: TemplateListing,
  officialVersionId: string,
): TemplateDemoPreviewPlan {
  const demoVersionId = listing.getDemoVersionId();
  if (!demoVersionId) {
    throw new TemplateDemoPreviewUnavailableError(
      'Interactive demo preview is not configured for this paid template',
    );
  }

  const parsed = TemplateDemoConfig.tryParse(listing.getDemoConfig());
  if (parsed === 'INVALID') {
    throw new TemplateDemoPreviewUnavailableError(
      'Interactive demo preview is not available for this paid template',
    );
  }
  const config = parsed?.isLimited() ? parsed : null;
  const isReleasedVersion =
    demoVersionId === officialVersionId ||
    demoVersionId === listing.getPublishedVersionId();
  if (isReleasedVersion && !config) {
    throw new TemplateDemoPreviewUnavailableError(
      'Interactive demo preview is not available for this paid template',
    );
  }

  return { demoVersionId, config };
}

/** Applies a plan to the loaded demo snapshot and marks it as a demo. */
export function buildTemplateDemoPreview(
  preview: TemplatePreviewResponseDto,
  config: TemplateDemoConfig | null,
): TemplatePreviewResponseDto {
  let result = preview;
  if (config?.isLimited()) {
    try {
      assertDemoConfigMatchesSnapshot(config, preview);
    } catch {
      throw new TemplateDemoPreviewUnavailableError(
        'Interactive demo preview is not available for this paid template',
      );
    }
    const filtered = applyTemplateDemoFilter(preview, config);
    result = filtered.preview;
    result.demoScope = 'LIMITED';
    result.hiddenContent = filtered.hidden;
  } else {
    result.demoScope = 'FULL_VERSION';
  }

  result.isDemo = true;
  result.interactive = true;
  // The raw allowlist is creator configuration, not public content.
  result.demoConfig = null;
  return result;
}
