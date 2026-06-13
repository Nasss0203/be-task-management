import { Controller, Get, Param, Inject, Query, Patch, Delete, Body } from '@nestjs/common';
import { PublicReadRateLimit } from 'src/common/decorator/rate-limit.decorator';
import type { WorkspaceTemplatesApplication } from '../interfaces/applications/workspace_templates.application.interface';
import { WORKSPACE_TEMPLATE_TYPES } from '../interfaces/types';
import { TemplateStatus, TemplateVisibility } from 'src/common/enum/template.enum';
import { FindWorkspaceTemplatesDto } from '../dto/find-workspace-templates.dto';
import { Auth } from 'src/common/decorator/auth.decorator';
import { type IAuth } from 'src/types/auth';
import { Public } from 'src/common/decorator/public.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { UpdateWorkspaceTemplateDto } from '../dto/update-workspace-template.dto';

@Controller('workspace-templates')

@PublicReadRateLimit()
export class WorkspaceTemplatesController {
  constructor(
    @Inject(WORKSPACE_TEMPLATE_TYPES.applications.WorkspaceTemplatesApplication)
    private readonly workspaceTemplatesApp: WorkspaceTemplatesApplication
  ) { }

  @Get()
  @ResponseMessage("Find all templates successfully")
  @Public()
  findAll(
    @Query() dto: FindWorkspaceTemplatesDto,
    @Auth() auth?: IAuth,
  ) {
    return this.workspaceTemplatesApp.findAllAvailableForUser(
      auth?.id,
      dto,
    );
  }

  @Get(':id')
  @ResponseMessage("Find template successfully")
  findOne(
    @Param('id') id: string,
    @Auth() auth?: IAuth,
  ) {
    return this.workspaceTemplatesApp.findOneAvailableForUser(id, auth?.id as any);
  }

  @Patch(':id')
  @ResponseMessage("Update template successfully")
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceTemplateDto,
    @Auth() auth: IAuth,
  ) {
    return this.workspaceTemplatesApp.update(id, auth.id, dto);
  }

  @Delete(':id')
  @ResponseMessage("Delete template successfully")
  delete(
    @Param('id') id: string,
    @Auth() auth: IAuth,
  ) {
    return this.workspaceTemplatesApp.delete(id, auth.id);
  }
}
