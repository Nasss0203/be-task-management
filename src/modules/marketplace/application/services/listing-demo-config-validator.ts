import { BadRequestException } from '@nestjs/common';

import type { TemplatePreviewLoader } from 'src/modules/template/application/services/template-preview-loader.service';

import { TemplateDemoConfig } from '../../domain/value-objects/template-demo-config.vo';
import { assertDemoConfigMatchesSnapshot } from './template-demo-preview-filter';

type LoaderArgs = Parameters<TemplatePreviewLoader['loadFrom']>;

/**
 * Validates a demo_config before it is stored: the schema must parse and, for
 * LIMITED configs, every id must exist in the demo version's snapshot.
 */
export async function assertDemoConfigFitsVersion(
  loader: TemplatePreviewLoader,
  template: LoaderArgs[0],
  demoVersion: LoaderArgs[1] | null,
  rawConfig: unknown,
): Promise<void> {
  let config: TemplateDemoConfig | null;
  try {
    config = TemplateDemoConfig.parse(rawConfig);
  } catch (error) {
    throw new BadRequestException(errorMessage(error));
  }
  if (!config?.isLimited()) return;
  if (!demoVersion) {
    throw new BadRequestException(
      'A LIMITED demo_config requires a demo_version_id',
    );
  }

  const snapshot = await loader.loadFrom(template, demoVersion);
  try {
    assertDemoConfigMatchesSnapshot(config, snapshot);
  } catch (error) {
    throw new BadRequestException(errorMessage(error));
  }
}

/** Domain invariants throw plain errors; surface them as 400s, not 500s. */
export function toBadRequest<T>(run: () => T): T {
  try {
    return run();
  } catch (error) {
    if (error instanceof Error && !('getStatus' in error)) {
      throw new BadRequestException(error.message);
    }
    throw error;
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Invalid demo_config';
}
