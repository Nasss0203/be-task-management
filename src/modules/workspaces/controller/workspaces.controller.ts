import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { ResponseMessage } from 'src/common/decorator/response-message.decorator';
import { type IAuth } from 'src/types/auth';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { UpdateWorkspaceDto } from '../dto/update-workspace.dto';
import { type CreateWorkspaceApplication } from '../interfaces/applications/create.workspace.application.interface';
import { WORKSPACETYPES } from '../interfaces/types';
import { WorkspacesService } from '../workspaces.service';

@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly workspacesService: WorkspacesService,
    @Inject(WORKSPACETYPES.applications.CreateWorkspaceApplication)
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

  @Get()
  findAll() {
    return this.workspacesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workspacesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(+id, updateWorkspaceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workspacesService.remove(+id);
  }
}
