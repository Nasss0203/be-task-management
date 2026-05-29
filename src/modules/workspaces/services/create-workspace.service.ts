import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { type CheckWorkspaceLimitService } from 'src/modules/billing/interfaces/services/check-workspace-limit.service.interface';
import { type UsageLimitEnforcerService } from 'src/modules/billing/interfaces/services/usage-limit/usage-limit-enforcer.service.interface';
import { BILLING_TYPES } from 'src/modules/billing/interfaces/types';
import { BoardViewType } from 'src/modules/boards/domain/entities/board.entity';
import { type CreateBoardService } from 'src/modules/boards/interfaces/services/create.board.service.interface';
import { BOARD_TYPES } from 'src/modules/boards/interfaces/types';
import { PageModel } from 'src/modules/page/domain/models/page.model';
import { PAGE_TYPES } from 'src/modules/page/interfaces/types';

import { type CreatePageService } from 'src/modules/page/interfaces/services/create.page.service.interface';
import { PageBlockType } from 'src/modules/page_block/domain/entities/page_block.entity';
import { type UpdatePageBlockService } from 'src/modules/page_block/interfaces/services/update.page_block.service.interface';
import { PAGE_BLOCK_TYPES } from 'src/modules/page_block/interfaces/types';
import { ROLE_PERMISSION_MAP } from 'src/modules/permission/constants/role-permission-map.constant';
import { type FindPermissionRepository } from 'src/modules/permission/interfaces/repositories/find-all-permission.repository.interface';
import { PERMISSION_TYPES } from 'src/modules/permission/interfaces/types';
import { type CreateProjectService } from 'src/modules/projects/interfaces/services/create.project.service.interface';
import { PROJECT_TYPES } from 'src/modules/projects/interfaces/types';
import { RoleName } from 'src/modules/role/domain/entities/role.entity';
import { type RoleRepository } from 'src/modules/role/interfaces/repositories/role.repository.interface';
import { ROLE_TYPES } from 'src/modules/role/interfaces/types';
import { type CreateRolePermissionService } from 'src/modules/role_permission/interfaces/services/create-role_permission.service.interface';
import { ROLE_PERMISSION_TYPES } from 'src/modules/role_permission/interfaces/types';
import { DEFAULT_TASK_PRIORITIES } from 'src/modules/task_priority/constants/default-task-priority.constant';
import { type CreateTaskPriorityService } from 'src/modules/task_priority/interfaces/services/create.task_priority.service.interface';
import { TASK_PRIORITY_TYPES } from 'src/modules/task_priority/interfaces/types';
import { DEFAULT_TASK_STATUSES } from 'src/modules/task_status/constants/default-task-status.constant';
import { type CreateTaskStatusService } from 'src/modules/task_status/interfaces/services/create.task_status.service.interface';
import { TASK_STATUS_TYPES } from 'src/modules/task_status/interfaces/types';
import { type CreateTaskService } from 'src/modules/tasks/interfaces/services/create-task.service.interface';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { type CreateUserRoleService } from 'src/modules/user_roles/interfaces/services/create.user_role.service.interface';
import { USER_ROLE_TYPES } from 'src/modules/user_roles/interfaces/types';
import { type CreateUserWorkspaceService } from 'src/modules/user_workspace/interfaces/services/create.user_workspace.service.interface';
import { USER_WORKSPACE_TYPES } from 'src/modules/user_workspace/interfaces/types';
import { generateSlug } from 'src/utils';
import { EntityManager } from 'typeorm';
import { PlanTypeWorkspace } from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
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

    @Inject(PERMISSION_TYPES.repositories.FindPermissionRepository)
    private readonly findPermissionRepository: FindPermissionRepository,

    @Inject(ROLE_PERMISSION_TYPES.services.CreateRolePermissionService)
    private readonly createRolePermissionService: CreateRolePermissionService,

    @Inject(BILLING_TYPES.services.CheckWorkspaceLimitService)
    private readonly checkWorkspaceLimitService: CheckWorkspaceLimitService,

    @Inject(BILLING_TYPES.services.UsageLimitEnforcerService)
    private readonly usageLimitEnforcerService: UsageLimitEnforcerService,
  ) {}

  private async createWorkspaceCoreDefault({
    name,
    planType,
    userId,
    manager,
  }: {
    name: string;
    planType?: PlanTypeWorkspace;
    userId: string;
    manager: EntityManager;
  }): Promise<{
    workspace: WorkspaceModel;
    createdPage: PageModel;
  }> {
    const baseSlug = generateSlug(name).toLowerCase();
    const slug = `${baseSlug}-${userId.slice(0, 6)}-${Date.now()}`;

    const exists = await this.workspaceRepo.existsBySlug(slug, manager);
    if (exists) {
      throw new HttpException(
        'Workspace slug already exists',
        HttpStatus.CONFLICT,
      );
    }

    const workspace = await this.workspaceRepo.save(
      {
        name,
        slug,
        planType: planType ?? PlanTypeWorkspace.FREE,
      },
      manager,
    );

    await this.createUserWorkspaceService.create(
      {
        user_id: userId,
        workspace_id: workspace.id,
      },
      manager,
    );

    await this.seedWorkspaceRbac({
      workspaceId: workspace.id,
      userId,
      manager,
    });

    const createdPage = await this.createPageService.createDefault(
      {
        workspace_id: workspace.id,
        title: workspace.name,
        slug: workspace.slug,
        created_by: userId,
      },
      manager,
    );

    return { workspace, createdPage };
  }

  private async seedWorkspaceRbac({
    workspaceId,
    userId,
    manager,
  }: {
    workspaceId: string;
    userId: string;
    manager: EntityManager;
  }): Promise<void> {
    const roles = await this.roleRepository.saveMany(
      [
        {
          name: RoleName.OWNER,
          workspace_id: workspaceId,
        },
        {
          name: RoleName.ADMIN,
          workspace_id: workspaceId,
        },
        {
          name: RoleName.MEMBER,
          workspace_id: workspaceId,
        },
        {
          name: RoleName.VIEWER,
          workspace_id: workspaceId,
        },
      ],
      manager,
    );

    const roleMap = new Map(roles.map((role) => [role.name, role.id]));
    const ownerRoleId = roleMap.get(RoleName.OWNER);

    if (!ownerRoleId || roleMap.size !== Object.values(RoleName).length) {
      throw new HttpException(
        'Default roles were not created correctly',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const permissions = await this.findPermissionRepository.findAll(manager);

    if (!permissions.length) {
      throw new HttpException(
        'Permissions not found',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const permissionMap = new Map(
      permissions.map((permission) => [permission.code, permission]),
    );

    const rolePermissions = Object.entries(ROLE_PERMISSION_MAP).flatMap(
      ([roleName, permissionNames]) => {
        const roleId = roleMap.get(roleName as RoleName);
        if (!roleId) return [];

        return permissionNames.map((permissionName) => {
          const permission = permissionMap.get(permissionName);

          if (!permission) {
            throw new HttpException(
              `Permission ${permissionName} not found`,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }

          return {
            role_id: roleId,
            permission_id: permission.id,
          };
        });
      },
    );

    if (rolePermissions.length) {
      await this.createRolePermissionService.createMany(
        rolePermissions,
        manager,
      );
    }

    await this.createUserRoleService.create(
      {
        user_id: userId,
        role_id: ownerRoleId,
        workspace_id: workspaceId,
        assigned_by: userId,
      },
      manager,
    );
  }

  private async seedDefaultTaskSetup({
    workspaceId,
    projectId,
    userId,
    manager,
  }: {
    workspaceId: string;
    projectId: string;
    userId: string;
    manager: EntityManager;
  }) {
    const createdStatuses = await this.createTaskStatusService.createMany(
      DEFAULT_TASK_STATUSES.map((item) => ({
        workspaceId,
        projectId,
        ...item,
      })),
      manager,
    );

    const createdPriorities = await this.createTaskPriorityService.createMany(
      DEFAULT_TASK_PRIORITIES.map((item) => ({
        workspaceId,
        projectId,
        ...item,
      })),
      manager,
    );

    const statusMap = new Map(createdStatuses.map((item) => [item.name, item]));
    const priorityMap = new Map(
      createdPriorities.map((item) => [item.name, item]),
    );

    const todoStatus = statusMap.get('Todo');
    const inProgressStatus = statusMap.get('In Progress');
    const doneStatus = statusMap.get('Done');

    const lowPriority = priorityMap.get('Low');
    const mediumPriority = priorityMap.get('Medium');
    const highPriority = priorityMap.get('High');

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

    await this.createTaskService.createMany(
      [
        {
          workspaceId,
          projectId,
          projectSeq: 1,
          title: 'Create first task',
          description: 'This is the first default task for your project.',
          statusId: todoStatus.id,
          priorityId: mediumPriority.id,
          createdBy: userId,
          estimateMinutes: 30,
        },
        {
          workspaceId,
          projectId,
          projectSeq: 2,
          title: 'Move task across columns',
          description: 'Try moving this task from Todo to In Progress.',
          statusId: inProgressStatus.id,
          priorityId: lowPriority.id,
          createdBy: userId,
          estimateMinutes: 20,
        },
        {
          workspaceId,
          projectId,
          projectSeq: 3,
          title: 'Complete your first workflow',
          description: 'Mark this task as Done when you finish setup.',
          statusId: doneStatus.id,
          priorityId: highPriority.id,
          createdBy: userId,
          estimateMinutes: 45,
        },
      ],
      manager,
    );

    return {
      createdStatuses,
      createdPriorities,
      statusMap,
      priorityMap,
    };
  }

  private async updateDefaultPageBlock({
    createdPage,
    workspaceId,
    projectId,
    projectName,
    boardId,
    manager,
  }: {
    createdPage: any;
    workspaceId: string;
    projectId: string;
    projectName: string;
    boardId: string;
    manager: EntityManager;
  }): Promise<void> {
    if (!createdPage.pageBlock?.id) return;

    await this.updatePageBlockService.update(
      {
        id: createdPage.pageBlock.id,
        type: PageBlockType.DATABASE_VIEW,
        title: projectName,
        data_config: [
          {
            project_id: projectId,
            workspace_id: workspaceId,
            board_id: boardId,
            view_type: BoardViewType.BOARD,
          },
        ],
      },
      manager,
    );
  }

  async createDefault({ userId }: { userId: string }): Promise<WorkspaceModel> {
    return this.uow.runInTransaction(async (manager) => {
      const { workspace, createdPage } = await this.createWorkspaceCoreDefault({
        name: 'Task management',
        planType: PlanTypeWorkspace.FREE,
        userId,
        manager,
      });

      await this.checkWorkspaceLimitService.applyBillingForNewWorkspace(
        userId,
        workspace.id,
        manager,
      );

      const project = await this.createProjectService.create(
        {
          workspace_id: workspace.id,
          name: `${workspace.name} project`,
          key: 'TASK',
          created_by: userId,
        },
        manager,
      );

      const board = await this.createBoardService.create(
        {
          workspaceId: workspace.id,
          projectId: project.id,
          name: workspace.name,
          createdBy: userId,
          viewType: BoardViewType.BOARD,
        },
        manager,
      );

      await this.usageLimitEnforcerService.syncProjectUsedValue(
        workspace.id,
        manager,
      );

      await this.seedDefaultTaskSetup({
        workspaceId: workspace.id,
        projectId: project.id,
        userId,
        manager,
      });

      await this.updateDefaultPageBlock({
        createdPage,
        workspaceId: workspace.id,
        projectId: project.id,
        projectName: project.name,
        boardId: board.id,
        manager,
      });

      return workspace;
    });
  }
}
