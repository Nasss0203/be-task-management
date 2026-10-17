import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { PERMISSIONS } from 'src/modules/permission/constants/permission.constant';
import type {
  TemplateContentPort,
  TemplateVersionPort,
} from 'src/modules/template/application/ports/template-content.port';
import { TemplatePreviewResponseDto } from 'src/modules/template/application/dto/template-preview/template-preview.response.dto';
import { TemplatePreviewLoader } from 'src/modules/template/application/services/template-preview-loader.service';
import { TEMPLATE_TYPES } from 'src/modules/template/template.types';

import { TemplateDemoConfig } from '../../../../domain/value-objects/template-demo-config.vo';
import { assertDemoConfigMatchesSnapshot } from '../../../services/template-demo-preview-filter';
import { buildTemplateDemoPreview } from '../../../services/template-demo-preview-policy';
import { PreviewTemplateDemoQuery } from './preview-template-demo.query';

/**
 * Creator-only dry run: returns exactly what visitors would receive for a
 * demo version + config, using the same filter as the public endpoints.
 * Read-only: nothing is saved, versioned or released.
 */
@Injectable()
export class PreviewTemplateDemoHandler {
  constructor(
    @Inject(TEMPLATE_TYPES.ports.Content)
    private readonly templates: TemplateContentPort,
    @Inject(TEMPLATE_TYPES.ports.Versions)
    private readonly versions: TemplateVersionPort,
    private readonly authorization: AuthorizationService,
    private readonly previewLoader: TemplatePreviewLoader,
  ) {}

  async execute(
    query: PreviewTemplateDemoQuery,
  ): Promise<TemplatePreviewResponseDto> {
    const template = await this.templates.findById(query.templateId);
    if (!template) throw new NotFoundException('Page template not found');

    const allowed =
      template.getCreatedBy() === query.userId ||
      (await this.authorization.authorize({
        userId: query.userId,
        permissions: [PERMISSIONS.WORKSPACE_UPDATE],
        target: { type: 'workspace', id: template.getWorkspaceId() },
      }));
    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to preview this template demo',
      );
    }

    const version = await this.versions.findById(query.demoVersionId);
    if (!version || version.getTemplateId() !== template.getId()) {
      throw new NotFoundException('Demo template version not found');
    }
    if (!version.isPublished()) {
      throw new BadRequestException(
        'Demo version must be a published template version',
      );
    }

    let config: TemplateDemoConfig | null;
    try {
      config = TemplateDemoConfig.parse(query.demoConfig);
    } catch (error) {
      throw new BadRequestException(errorMessage(error));
    }

    const preview = await this.previewLoader.loadFrom(template, version);
    const limited = config?.isLimited() ? config : null;
    if (limited) {
      try {
        assertDemoConfigMatchesSnapshot(limited, preview);
      } catch (error) {
        throw new BadRequestException(errorMessage(error));
      }
    }
    return buildTemplateDemoPreview(preview, limited);
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Invalid demo_config';
}
