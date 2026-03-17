import { Injectable } from '@nestjs/common';
import { CreateWorkspaceTemplateDto } from './dto/create-workspace_template.dto';
import { UpdateWorkspaceTemplateDto } from './dto/update-workspace_template.dto';

@Injectable()
export class WorkspaceTemplatesService {
  create(createWorkspaceTemplateDto: CreateWorkspaceTemplateDto) {
    return 'This action adds a new workspaceTemplate';
  }

  findAll() {
    return `This action returns all workspaceTemplates`;
  }

  findOne(id: number) {
    return `This action returns a #${id} workspaceTemplate`;
  }

  update(id: number, updateWorkspaceTemplateDto: UpdateWorkspaceTemplateDto) {
    return `This action updates a #${id} workspaceTemplate`;
  }

  remove(id: number) {
    return `This action removes a #${id} workspaceTemplate`;
  }
}
