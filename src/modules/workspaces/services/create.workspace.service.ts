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

      // Create workspace
      const workspace = await this.workspaceRepo.save(
        {
          ...createWorkspaceDto,
          slug,
          planType: createWorkspaceDto.planType ?? PlanTypeWorkspace.FREE,
        },
        manager,
      );

      // creator joined workspace
      await this.createUserWorkspaceService.create(
        {
          user_id: userId,
          workspace_id: workspace.id,
        },
        manager,
      );

      // 3. Seed roles mặc định

      // 4. Create user_roles (assign Owner cho creator)
      // 5. Prepare / show templates
      // 6. Nếu user chọn template:
      // 6.1 Create project
      // 6.2 Create board
      // 6.3 Seed task status
      // 6.4 Seed task priority
      // 6.5 Create sample tasks

      return workspace;
    });
  }
}
