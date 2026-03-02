import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateUserWorkspaceDto } from '../dto/create-user_workspace.dto';
import { UpdateUserWorkspaceDto } from '../dto/update-user_workspace.dto';
import { UserWorkspacesService } from '../user_workspace.service';

@Controller('workspace-members')
export class UserWorkspacesController {
  constructor(private readonly UserWorkspacesService: UserWorkspacesService) {}

  @Post()
  create(@Body() createUserWorkspaceDto: CreateUserWorkspaceDto) {
    return this.UserWorkspacesService.create(createUserWorkspaceDto);
  }

  @Get()
  findAll() {
    return this.UserWorkspacesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.UserWorkspacesService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserWorkspaceDto: UpdateUserWorkspaceDto,
  ) {
    return this.UserWorkspacesService.update(+id, updateUserWorkspaceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.UserWorkspacesService.remove(+id);
  }
}
