import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { type CreateWorkspaceApplication } from '../interfaces/applications/create.workspace.application.interface';
import { type FindWorkspaceApplication } from '../interfaces/applications/find.workspace.application.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Controller('workspaces')
export class WorkspacesController {
  constructor(
    @Inject(WORKSPACE_TYPES.applications.CreateWorkspaceApplication)
    private readonly createWorkspaceAppImpl: CreateWorkspaceApplication,

    @Inject(WORKSPACE_TYPES.applications.FindWorkspaceApplication)
    private readonly findWorkspaceApplicationImpl: FindWorkspaceApplication,
  ) {}

  @Post()
  @ResponseMessage('Workspaces created')
  async create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @Auth() auth: IAuth,
  ) {
    return await this.createWorkspaceAppImpl.create({
      userId: auth.id,
      createWorkspaceDto,
    });
  }

  @Get()
  @ResponseMessage('Find all workspace')
  async findAllWorkspace(@Auth() auth: IAuth) {
    return await this.findWorkspaceApplicationImpl.findAllByUserId(auth.id);
  }
}
