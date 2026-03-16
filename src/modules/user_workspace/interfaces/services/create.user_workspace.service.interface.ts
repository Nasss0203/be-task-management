import { EntityManager } from 'typeorm';
import { UserWorkspaceModel } from '../../domain/models/user_workspace.model';
import { CreateUserWorkspaceDto } from '../../dto/create-user_workspace.dto';

export interface CreateUserWorkspaceService {
  create(
    createUserWorkspaceDto: CreateUserWorkspaceDto,
    manager?: EntityManager,
  ): Promise<UserWorkspaceModel>;
}
