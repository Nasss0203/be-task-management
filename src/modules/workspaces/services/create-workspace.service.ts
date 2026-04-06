import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { BoardViewType } from 'src/modules/boards/domain/entities/board.entity';
import { type CreateBoardService } from 'src/modules/boards/interfaces/services/create.board.service.interface';
import { BOARD_TYPES } from 'src/modules/boards/interfaces/types';
import { type CreatePageService } from 'src/modules/page/interfaces/services/create.page.service.interface';
import { PAGE_TYPES } from 'src/modules/page/interfaces/types';
import { PageBlockType } from 'src/modules/page_block/domain/entities/page_block.entity';
import { type UpdatePageBlockService } from 'src/modules/page_block/interfaces/services/update.page_block.service.interface';
import { PAGE_BLOCK_TYPES } from 'src/modules/page_block/interfaces/types';
import { type CreateProjectService } from 'src/modules/projects/interfaces/services/create.project.service.interface';
import { PROJECT_TYPES } from 'src/modules/projects/interfaces/types';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { type RoleRepository } from 'src/modules/role/interfaces/repositories/role.repository.interface';
import { ROLE_TYPES } from 'src/modules/role/interfaces/types';
import { type CreateTaskPriorityService } from 'src/modules/task_priority/interfaces/services/create.task_priority.service.interface';
import { TASK_PRIORITY_TYPES } from 'src/modules/task_priority/interfaces/types';
import { type CreateTaskStatusService } from 'src/modules/task_status/interfaces/services/create.task_status.service.interface';
import { TASK_STATUS_TYPES } from 'src/modules/task_status/interfaces/types';
import { type CreateTaskService } from 'src/modules/tasks/interfaces/services/create.task.repository.interface';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { type CreateUserRoleService } from 'src/modules/user_roles/interfaces/services/create.user_role.service.interface';
import { USER_ROLE_TYPES } from 'src/modules/user_roles/interfaces/types';
import { type CreateUserWorkspaceService } from 'src/modules/user_workspace/interfaces/services/create.user_workspace.service.interface';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { generateSlug } from 'src/utils';
import { PlanTypeWorkspace } from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { type CreateWorkspaceMultiRepository } from '../interfaces/repositories/create-workspace.repository.interface';
import { CreateWorkspaceService } from '../interfaces/services/create-workspace.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';

@Injectable()
export class CreateWorkspaceServiceImpl implements CreateWorkspaceService {
  constructor(
    @Inject(WORKSPACE_TYPES.repositories.WorkspaceRepository)
    private readonly workspaceRepo: CreateWorkspaceMultiRepository,

    @Inject(USER_WORKSPACE_TYPES.services.CreateUserWorkspaceService)
    private readonly createUserWorkspaceService: CreateUserWorkspaceService,

    @Inject(ROLE_TYPES.repositories.RoleRepository)
    private readonly roleRepository: RoleRepository,

    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(USER_ROLE_TYPES.services.CreateUserRoleService)
    private readonly createUserRoleService: CreateUserRoleService,

    @Inject(PAGE_TYPES.services.CreatePageService)
    private readonly createPageService: CreatePageService,

    @Inject(PROJECT_TYPES.services.CreateProjectService)
    private readonly createProjectService: CreateProjectService,

    @Inject(PAGE_BLOCK_TYPES.services.UpdatePageBlockService)
    private readonly updatePageBlockService: UpdatePageBlockService,

    @Inject(BOARD_TYPES.services.CreateBoardService)
    private readonly createBoardService: CreateBoardService,

    @Inject(TASK_STATUS_TYPES.services.CreateTaskStatusService)
    private readonly createTaskStatusService: CreateTaskStatusService,

    @Inject(TASK_PRIORITY_TYPES.services.CreateTaskPriorityService)
    private readonly createTaskPriorityService: CreateTaskPriorityService,

    @Inject(TASK_TYPES.services.CreateTaskService)
    private readonly createTaskService: CreateTaskService,
  ) {}

  async createDefault({ userId }: { userId: string }): Promise<WorkspaceModel> {
    const defaultName = 'Task management';
    const baseSlug = generateSlug(defaultName).toLowerCase();
    const slug = `${baseSlug}-${userId.slice(0, 6)}-${Date.now()}`;

    return this.uow.runInTransaction(async (manager) => {
      const exists = await this.workspaceRepo.existsBySlug(slug, manager);
      if (exists) {
        throw new HttpException(
          'Workspace slug already exists',
          HttpStatus.CONFLICT,
        );
      }

      // 1. Create workspace
      const workspace = await this.workspaceRepo.save(
        {
          name: defaultName,
          slug,
          planType: PlanTypeWorkspace.FREE,
        },
        manager,
      );

      // 2. Creator joins workspace
      await this.createUserWorkspaceService.create(
        {
          user_id: userId,
          workspace_id: workspace.id,
        },
        manager,
      );

      // 3. Seed default roles
      const roles = await this.roleRepository.saveMany(
        [
          {
            name: RoleName.OWNER,
            workspace_id: workspace.id,
          },
          {
            name: RoleName.MEMBER,
            workspace_id: workspace.id,
          },
        ],
        manager,
      );

      const ownerRole = roles.find((role) => role.name === RoleName.OWNER);

      if (!ownerRole) {
        throw new HttpException(
          'Owner role was not created',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // 4. Assign owner role to creator
      await this.createUserRoleService.create(
        {
          user_id: userId,
          role_id: ownerRole.id,
          workspace_id: workspace.id,
          assigned_by: userId,
        },
        manager,
      );

      // 5. Create home page
      const createdPage = await this.createPageService.create(
        {
          workspace_id: workspace.id,
          title: workspace.name,
          slug: workspace.slug,
          created_by: userId,
        },
        manager,
      );

      // 6. Create default project
      const project = await this.createProjectService.create(
        {
          workspace_id: workspace.id,
          name: `${workspace.name} project`,
          key: 'TASK',
          created_by: userId,
        },
        manager,
      );

      // 7. Create default board
      const board = await this.createBoardService.create(
        {
          workspaceId: workspace.id,
          projectId: project.id,
          name: workspace.name,
          createdBy: userId,
          viewType: BoardViewType.BOARD, // đồng bộ với view mặc định bên dưới
        },
        manager,
      );

      // 8. Seed default task statuses
      const createdStatuses = await this.createTaskStatusService.createMany(
        [
          {
            workspaceId: workspace.id,
            projectId: project.id,
            name: 'Todo',
            position: 0,
            color: '#94A3B8',
            isDone: false,
          },
          {
            workspaceId: workspace.id,
            projectId: project.id,
            name: 'In Progress',
            position: 1,
            color: '#3B82F6',
            isDone: false,
          },
          {
            workspaceId: workspace.id,
            projectId: project.id,
            name: 'Done',
            position: 2,
            color: '#22C55E',
            isDone: true,
          },
        ],
        manager,
      );

      // 9. Seed default priorities
      const createdPriorities = await this.createTaskPriorityService.createMany(
        [
          {
            workspaceId: workspace.id,
            projectId: project.id,
            name: 'Low',
            level: 1,
            color: '#94A3B8',
          },
          {
            workspaceId: workspace.id,
            projectId: project.id,
            name: 'Medium',
            level: 2,
            color: '#3B82F6',
          },
          {
            workspaceId: workspace.id,
            projectId: project.id,
            name: 'High',
            level: 3,
            color: '#F59E0B',
          },
          {
            workspaceId: workspace.id,
            projectId: project.id,
            name: 'Urgent',
            level: 4,
            color: '#EF4444',
          },
        ],
        manager,
      );

      const todoStatus = createdStatuses.find((item) => item.name === 'Todo');
      const inProgressStatus = createdStatuses.find(
        (item) => item.name === 'In Progress',
      );
      const doneStatus = createdStatuses.find((item) => item.name === 'Done');

      const lowPriority = createdPriorities.find((item) => item.name === 'Low');
      const mediumPriority = createdPriorities.find(
        (item) => item.name === 'Medium',
      );
      const highPriority = createdPriorities.find(
        (item) => item.name === 'High',
      );

      if (!todoStatus || !inProgressStatus || !doneStatus) {
        throw new HttpException(
          'Default task statuses were not seeded correctly',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (!lowPriority || !mediumPriority || !highPriority) {
        throw new HttpException(
          'Default task priorities were not seeded correctly',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // 10. Create sample tasks
      await this.createTaskService.createMany(
        [
          {
            workspaceId: workspace.id,
            projectId: project.id,
            projectSeq: 1,
            title: 'Create first task',
            description: 'This is the first default task for your project.',
            statusId: todoStatus.id,
            priorityId: mediumPriority.id,
            reporterId: userId,
            estimateMinutes: 30,
          },
          {
            workspaceId: workspace.id,
            projectId: project.id,
            projectSeq: 2,
            title: 'Move task across columns',
            description: 'Try moving this task from Todo to In Progress.',
            statusId: inProgressStatus.id,
            priorityId: lowPriority.id,
            reporterId: userId,
            estimateMinutes: 20,
          },
          {
            workspaceId: workspace.id,
            projectId: project.id,
            projectSeq: 3,
            title: 'Complete your first workflow',
            description: 'Mark this task as Done when you finish setup.',
            statusId: doneStatus.id,
            priorityId: highPriority.id,
            reporterId: userId,
            estimateMinutes: 45,
          },
        ],
        manager,
      );

      // 11. Update page block sau khi đã có project + board
      if (createdPage.pageBlock?.id) {
        await this.updatePageBlockService.update(
          {
            id: createdPage.pageBlock.id,
            type: PageBlockType.PROJECT,
            title: project.name,
            data_config: {
              entity_type: 'PROJECT',
              project_id: project.id,
              workspace_id: workspace.id,
              board_id: board.id,
              view: BoardViewType.BOARD,
              is_open: false,
            },
          },
          manager,
        );
      }

      return workspace;
    });
  }

  async create({
    userId,
    createWorkspaceDto,
  }: {
    userId: string;
    createWorkspaceDto: CreateWorkspaceDto;
  }): Promise<WorkspaceModel> {
    const baseSlug = generateSlug(createWorkspaceDto.name).toLowerCase();
    const slug = `${baseSlug}-${userId.slice(0, 6)}-${Date.now()}`;

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
      const roles = await this.roleRepository.saveMany(
        [
          {
            name: RoleName.OWNER,
            workspace_id: workspace.id,
          },
          {
            name: RoleName.MEMBER,
            workspace_id: workspace.id,
          },
        ],
        manager,
      );

      const ownerRole = roles.find((role: any) => role.name === RoleName.OWNER);

      if (!ownerRole) {
        throw new HttpException(
          'Owner role was not created',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // 4. Create user_roles (assign Owner cho creator)
      await this.createUserRoleService.create(
        {
          user_id: userId,
          role_id: ownerRole.id,
          workspace_id: workspace.id,
          assigned_by: userId,
        },
        manager,
      );

      await this.createPageService.create(
        {
          workspace_id: workspace.id,
          title: workspace.name,
          slug: workspace.slug,
          created_by: userId,
        },
        manager,
      );

      return workspace;
    });
  }
}
