import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WorkspaceTemplatesService } from './workspace_templates.service';
import { CreateWorkspaceTemplateDto } from './dto/create-workspace_template.dto';
import { UpdateWorkspaceTemplateDto } from './dto/update-workspace_template.dto';

@Controller('workspace-templates')
export class WorkspaceTemplatesController {
  constructor(private readonly workspaceTemplatesService: WorkspaceTemplatesService) {}

  @Post()
  create(@Body() createWorkspaceTemplateDto: CreateWorkspaceTemplateDto) {
    return this.workspaceTemplatesService.create(createWorkspaceTemplateDto);
  }

  @Get()
  findAll() {
    return this.workspaceTemplatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspaceTemplatesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWorkspaceTemplateDto: UpdateWorkspaceTemplateDto) {
    return this.workspaceTemplatesService.update(+id, updateWorkspaceTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workspaceTemplatesService.remove(+id);
  }
}
