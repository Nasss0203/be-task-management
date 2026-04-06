import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { type CreateWorkspaceApplication } from '../interfaces/applications/create-workspace.application.interface';
import { type FindWorkspaceApplication } from '../interfaces/applications/find.workspace.application.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Controller('workspaces')
export class WorkspacesController {
  constructor(
    @Inject(WORKSPACE_TYPES.applications.CreateWorkspaceApplication)
    private readonly CreateWorkspaceMultiServiceAppImpl: CreateWorkspaceApplication,

    @Inject(WORKSPACE_TYPES.applications.FindWorkspaceApplication)
    private readonly findWorkspaceApplicationImpl: FindWorkspaceApplication,
  ) {}

  @Post('default')
  @ResponseMessage('Workspaces created')
  async create(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @Auth() auth: IAuth,
  ) {
    return await this.CreateWorkspaceMultiServiceAppImpl.createDeault({
      userId: auth.id,
      createWorkspaceDto,
    });
  }

  @Post()
  @ResponseMessage('Workspaces created')
  async createV2(
    @Body() createWorkspaceDto: CreateWorkspaceDto,
    @Auth() auth: IAuth,
  ) {
    return await this.CreateWorkspaceMultiServiceAppImpl.create({
      userId: auth.id,
      createWorkspaceDto,
    });
  }

  @Get()
  @ResponseMessage('Find all workspace')
  async findAllWorkspace(@Auth() auth: IAuth) {
    return await this.findWorkspaceApplicationImpl.findAllByUserId(auth.id);
  }

  @Get(':workspaceId')
  @ResponseMessage('Find one workspace')
  findOneWorkspaceById(
    @Auth() auth: IAuth,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.findWorkspaceApplicationImpl.findOneWorkspaceById(
      auth.id,
      workspaceId,
    );
  }
}
