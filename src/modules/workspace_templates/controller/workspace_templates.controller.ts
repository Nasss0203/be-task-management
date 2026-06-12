import { Controller, Get, Param, Inject } from '@nestjs/common';
import { PublicReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import type { WorkspaceTemplatesService } from '../interfaces/services/workspace_templates.service.interface';
import { WORKSPACE_TEMPLATE_TYPES } from '../interfaces/types';
import { TemplateStatus, TemplateVisibility } from 'src/common/enum/template.enum';

@Controller('workspace-templates')
@PublicReadRateLimit()
export class WorkspaceTemplatesController {
  constructor(
    @Inject(WORKSPACE_TEMPLATE_TYPES.services.WorkspaceTemplatesService)
    private readonly workspaceTemplatesService: WorkspaceTemplatesService
  ) {}

  @Get()
  findAll() {
    return this.workspaceTemplatesService.findAll({
      status: TemplateStatus.PUBLISHED,
      visibility: TemplateVisibility.PUBLIC,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspaceTemplatesService.findOne(id);
  }
}
