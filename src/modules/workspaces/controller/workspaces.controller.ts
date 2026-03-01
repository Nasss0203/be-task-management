import { Body, Controller, Inject, Post } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { type CreateWorkspaceApplication } from '../interfaces/applications/create.workspace.application.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Controller('workspaces')
export class WorkspacesController {
  constructor(
    @Inject(WORKSPACE_TYPES.applications.CreateWorkspaceApplication)
    private readonly createWorkspaceApp: CreateWorkspaceApplication,
  ) {}

  @Post()
  @ResponseMessage('Workspaces created successfully')
  async create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @Auth() auth: IAuth,
  ) {
    return await this.createWorkspaceApp.create({
      userId: auth.id,
      createWorkspaceDto,
    });
  }
}
