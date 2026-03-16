import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { UserWorkspaceModel } from '../domain/models/user_workspace.model';
import { CreateUserWorkspaceDto } from '../dto/create-user_workspace.dto';
import { type UserWorkspaceRepository } from '../interfaces/repositories/user_workspace.repository.interface';
import { CreateUserWorkspaceService } from '../interfaces/services/create.user_workspace.service.interface';
import { USER_WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class CreateUserWorkspaceServiceImpl implements CreateUserWorkspaceService {
  constructor(
    @Inject(USER_WORKSPACE_TYPES.repositories.UserWorkspaceRepository)
    private readonly repo: UserWorkspaceRepository,
  ) {}
  async create(
    createUserWorkspaceDto: CreateUserWorkspaceDto,
    manager?: EntityManager,
  ): Promise<UserWorkspaceModel> {
    const create = await this.repo.create(createUserWorkspaceDto, manager);

    return create;
  }
}
