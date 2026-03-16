import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { type CreateUserWorkspaceService } from 'src/modules/user_workspace/interfaces/services/create.user_workspace.service.interface';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { generateSlug } from 'src/utils';
import { PlanTypeWorkspace } from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { type WorkspaceRepository } from '../interfaces/repositories/workspace.repository.interface';
import { CreateWorkspaceService } from '../interfaces/services/create.workspace.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class CreateWorkSpaceServiceImpl implements CreateWorkspaceService {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepo: WorkspaceRepository,

    @Inject(USER_WORKSPACE_TYPES.services.CreateUserWorkspaceService)
    private readonly createUserWorkspaceService: CreateUserWorkspaceService,

    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,
  ) {}
  async create({
    userId,
    createWorkspaceDto,
  }: {
    userId: string;
    createWorkspaceDto: CreateWorkspaceDto;
  }): Promise<WorkspaceModel> {
    const slug = generateSlug(createWorkspaceDto.name).toLowerCase();

    return this.uow.runInTransaction(async (manager) => {
      const exists = await this.workspaceRepo.existsBySlug(slug, manager);
      if (exists) {
        throw new HttpException(
          'Workspace slug already exists',
          HttpStatus.CONFLICT,
        );
      }

      const workspace = await this.workspaceRepo.save(
        {
          ...createWorkspaceDto,
          slug,
          planType: createWorkspaceDto.planType ?? PlanTypeWorkspace.FREE,
        },
        manager,
      );
      console.log('🚀 ~ workspace~', workspace);

      await this.createUserWorkspaceService.create(
        {
          user_id: userId,
          workspace_id: workspace.id,
        },
        manager,
      );

      return workspace;
    });
  }
}
