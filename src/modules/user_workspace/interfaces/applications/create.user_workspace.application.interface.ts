import { EntityManager } from 'typeorm';
import { CreateUserWorkspaceDto } from '../../dto/create-user_workspace.dto';
import { UserWorkspaceResponseDto } from '../../dto/response/user_workspace.response.dto';

export interface CreateUserWorkspaceApplication {
  create(
    createUserWorkspaceDto: CreateUserWorkspaceDto,
    manager?: EntityManager,
  ): Promise<UserWorkspaceResponseDto>;
}
