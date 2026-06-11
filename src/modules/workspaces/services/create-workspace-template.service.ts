import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { BoardViewType } from 'src/modules/boards/domain/entities/board.entity';
import { BoardModel } from 'src/modules/boards/domain/models/board.model';
import { type CreateBoardService } from 'src/modules/boards/interfaces/services/create.board.service.interface';
import { BOARD_TYPES } from 'src/modules/boards/interfaces/types';
import { PageModel } from 'src/modules/page/domain/models/page.model';
import { type CreatePageService } from 'src/modules/page/interfaces/services/create.page.service.interface';
import { PAGE_TYPES } from 'src/modules/page/interfaces/types';
import { PageBlockType } from 'src/modules/page_block/domain/entities/page_block.entity';
import { type CreatePageBlockService } from 'src/modules/page_block/interfaces/services/create.page_block.service.interface';
import { PAGE_BLOCK_TYPES } from 'src/modules/page_block/interfaces/types';
import { ROLE_PERMISSION_MAP } from 'src/modules/permission/constants/role-permission-map.constant';
import { type FindPermissionRepository } from 'src/modules/permission/interfaces/repositories/find-all-permission.repository.interface';
import { PERMISSION_TYPES } from 'src/modules/permission/interfaces/types';
import { ProjectModel } from 'src/modules/projects/domain/models/projects.model';
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
import {
  PlanTypeWorkspace,
  WorkspaceLayoutMode,
} from '../domain/entities/workspace.entity';
import { WorkspaceModel } from '../domain/models/workspaces.model';
import { type CreateWorkspaceMultiRepository } from '../interfaces/repositories/create-workspace.repository.interface';
import {
  CreateWorkspaceTemplateService,
  CreateWorkspaceWithTemplateInput,
} from '../interfaces/services/create-workspace-template.service.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';
import {
  TemplateBoardConfig,
  TemplatePageBlockConfig,
  TemplateProjectConfig,
  TemplateTaskConfig,
  TemplateTaskPriorityConfig,
  TemplateTaskStatusConfig,
  WorkspaceTemplateConfig,
  WorkspaceTemplateType,
} from '../types/types';
import { type CheckWorkspaceLimitService } from 'src/modules/billing/interfaces/services/check-workspace-limit.service.interface';
import { BILLING_TYPES } from 'src/modules/billing/interfaces/types';
import type { WorkspaceTemplatesService } from 'src/modules/workspace_templates/interfaces/services/workspace_templates.service.interface';
import { WORKSPACE_TEMPLATE_TYPES } from 'src/modules/workspace_templates/interfaces/types';
import type { PageTemplateBlocksService } from 'src/modules/page_template_blocks/interfaces/services/page_template_blocks.service.interface';
import { PAGE_TEMPLATE_BLOCK_TYPES } from 'src/modules/page_template_blocks/interfaces/types';
import { PageBlock } from 'src/modules/page_block/domain/entities/page_block.entity';

@Injectable()
export class CreateWorkspaceTemplateServiceImpl implements CreateWorkspaceTemplateService {
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

    @Inject(PAGE_BLOCK_TYPES.services.CreatePageBlockService)
    private readonly createPageBlockService: CreatePageBlockService,

    @Inject(BILLING_TYPES.services.CheckWorkspaceLimitService)
    private readonly checkWorkspaceLimitService: CheckWorkspaceLimitService,

    @Inject(WORKSPACE_TEMPLATE_TYPES.services.WorkspaceTemplatesService)
    private readonly workspaceTemplatesService: WorkspaceTemplatesService,

    @Inject(PAGE_TEMPLATE_BLOCK_TYPES.services.PageTemplateBlocksService)
    private readonly pageTemplateBlocksService: PageTemplateBlocksService,
  ) {}

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

  private async createWorkspaceCore({
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
        layoutMode: WorkspaceLayoutMode.TABS,
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

    return { workspace };
  }

  private async createWorkspacePage({
    workspace,
    userId,
    manager,
  }: {
    workspace: WorkspaceModel;
    userId: string;
    manager: EntityManager;
  }): Promise<PageModel> {
    return this.createPageService.create(
      {
        workspace_id: workspace.id,
        title: workspace.name,
        slug: workspace.slug,
        created_by: userId,
      },
      manager,
    );
  }

  private getTemplateConfig({
    template,
    workspaceName,
  }: {
    template: WorkspaceTemplateType;
    workspaceName: string;
  }): WorkspaceTemplateConfig {
    const defaultStatuses = DEFAULT_TASK_STATUSES.map((item) => ({
      projectTemplateKey: 'main',
      name: item.name,
      position: item.position,
      color: item.color,
    }));

    const defaultPriorities = DEFAULT_TASK_PRIORITIES.map((item) => ({
      projectTemplateKey: 'main',
      name: item.name,
      level: item.level,
      color: item.color,
    }));

    switch (template) {
      case WorkspaceTemplateType.BLANK_PAGE:
        return {
          projects: [],
          boards: [],
          pageBlocks: [],
          statuses: [],
          priorities: [],
          tasks: [],
        };
      case WorkspaceTemplateType.BLANK_DATABASE:
        return {
          projects: [
            {
              templateKey: 'main',
              name: workspaceName,
              key: 'TASK',
            },
          ],
          boards: [
            {
              templateKey: 'main-board',
              projectTemplateKey: 'main',
              name: `${workspaceName} - Board`,
              viewType: BoardViewType.BOARD,
            },
            {
              templateKey: 'main-list',
              projectTemplateKey: 'main',
              name: `${workspaceName} - List`,
              viewType: BoardViewType.LIST,
            },
          ],
          pageBlocks: [
            {
              templateKey: 'main-block',
              boardTemplateKey: 'main-board',
              title: `${workspaceName} - Board`,
            },
            {
              templateKey: 'main-list-block',
              boardTemplateKey: 'main-list',
              title: `${workspaceName} - List`,
            },
          ],
          statuses: defaultStatuses,
          priorities: defaultPriorities,
          tasks: [],
        };
      case WorkspaceTemplateType.TASK_TRACKER:
      case WorkspaceTemplateType.PROJECT:
      default:
        return {
          projects: [
            {
              templateKey: 'main',
              name: workspaceName,
              key: 'TASK',
            },
          ],
          boards: [
            {
              templateKey: 'main-board',
              projectTemplateKey: 'main',
              name: `${workspaceName} - Board`,
              viewType: BoardViewType.BOARD,
            },
            {
              templateKey: 'main-list',
              projectTemplateKey: 'main',
              name: `${workspaceName} - CALENDA`,
              viewType: BoardViewType.CALENDAR,
            },
          ],
          pageBlocks: [
            {
              templateKey: 'main-block',
              boardTemplateKey: 'main-board',
              title: `${workspaceName} - Board`,
            },
            {
              templateKey: 'main-list-block',
              boardTemplateKey: 'main-list',
              title: `${workspaceName} - List`,
            },
          ],
          statuses: defaultStatuses,
          priorities: defaultPriorities,
          tasks: [
            {
              projectTemplateKey: 'main',
              title: 'Create first task',
              description: 'This is the first default task for your project.',
              statusName: 'Todo',
              priorityName: 'Medium',
              estimateMinutes: 30,
            },
            {
              projectTemplateKey: 'main',
              title: 'Move task across columns',
              description: 'Try moving this task from Todo to In Progress.',
              statusName: 'In Progress',
              priorityName: 'Low',
              estimateMinutes: 20,
            },
            {
              projectTemplateKey: 'main',
              title: 'Complete your first workflow',
              description: 'Mark this task as Done when you finish setup.',
              statusName: 'Done',
              priorityName: 'High',
              estimateMinutes: 45,
            },
          ],
        };
    }
  }

  private async createManyProjects({
    workspaceId,
    userId,
    projects,
    manager,
  }: {
    workspaceId: string;
    userId: string;
    projects: TemplateProjectConfig[];
    manager: EntityManager;
  }): Promise<Map<string, ProjectModel>> {
    const projectMap = new Map<string, ProjectModel>();

    for (const item of projects) {
      const project = await this.createProjectService.create(
        {
          workspace_id: workspaceId,
          name: item.name,
          key: item.key,
          created_by: userId,
        },
        manager,
      );

      projectMap.set(item.templateKey, project);
    }

    return projectMap;
  }

  private async createManyBoards({
    workspaceId,
    userId,
    boards,
    projectMap,
    manager,
  }: {
    workspaceId: string;
    userId: string;
    boards: TemplateBoardConfig[];
    projectMap: Map<string, ProjectModel>;
    manager: EntityManager;
  }): Promise<Map<string, BoardModel>> {
    const boardMap = new Map<string, BoardModel>();

    for (const item of boards) {
      const project = projectMap.get(item.projectTemplateKey);
      if (!project) {
        throw new BadRequestException(
          `Project template key ${item.projectTemplateKey} not found`,
        );
      }

      const board = await this.createBoardService.create(
        {
          workspaceId,
          projectId: project.id,
          name: item.name,
          createdBy: userId,
          viewType: item.viewType,
        },
        manager,
      );

      boardMap.set(item.templateKey, board);
    }

    return boardMap;
  }

  private async createManyPageBlocks({
    pageId,
    createdBy,
    templateId,
    pageBlocks,
    boardMap,
    manager,
  }: {
    pageId: string;
    createdBy: string;
    templateId?: string | null;
    pageBlocks: TemplatePageBlockConfig[];
    boardMap: Map<string, BoardModel>;
    manager: EntityManager;
  }): Promise<void> {
    const blocksToInsert: Partial<PageBlock>[] = [];
    let orderIndex = 1;

    // Use page template blocks from DB if a templateId exists
    if (templateId) {
      const dbBlocks = await this.pageTemplateBlocksService.findByTemplateId(templateId);
      
      for (const dbBlock of dbBlocks) {
        let dataConfig: any = dbBlock.content;
        let blockType = dbBlock.type as string;
        let styleConfig: any = null;

        if (blockType === 'HEADING_1') {
          blockType = PageBlockType.HEADER;
          styleConfig = { level: 1 };
        } else if (blockType === 'HEADING_2') {
          blockType = PageBlockType.HEADER;
          styleConfig = { level: 2 };
        } else if (blockType === 'HEADING_3') {
          blockType = PageBlockType.HEADER;
          styleConfig = { level: 3 };
        }

        // If it's a database view, map the board ID
        if (blockType === PageBlockType.DATABASE_VIEW && dataConfig?.boardTemplateKey) {
          const board = boardMap.get(dataConfig.boardTemplateKey);
          if (!board) {
            throw new BadRequestException(`Board template key ${dataConfig.boardTemplateKey} not found`);
          }
          dataConfig = {
            ...dataConfig,
            workspace_id: board.workspaceId,
            project_id: board.projectId,
            default_board_id: board.id,
            default_view_type: board.viewType,
          };
        }

        blocksToInsert.push({
          page_id: pageId,
          type: blockType as PageBlockType,
          title: dataConfig?.title ?? null,
          order_index: dbBlock.orderIndex,
          style_config: styleConfig,
          data_config: blockType === PageBlockType.DATABASE_VIEW ? dataConfig : null,
          created_by: createdBy,
          content: blockType !== PageBlockType.DATABASE_VIEW ? dbBlock.content : null,
        });
        
        // Track the max order index used by DB blocks
        if (dbBlock.orderIndex >= orderIndex) {
          orderIndex = dbBlock.orderIndex + 1;
        }
      }
    }

    // Fallback to legacy config if needed (or combine them)
    if (!templateId && pageBlocks && pageBlocks.length > 0) {
      const createdProjectIds = new Set<string>();

      for (const item of pageBlocks) {
        const board = boardMap.get(item.boardTemplateKey);
        if (!board) {
          throw new BadRequestException(`Board template key ${item.boardTemplateKey} not found`);
        }

        if (createdProjectIds.has(board.projectId)) {
          continue;
        }
        createdProjectIds.add(board.projectId);

        blocksToInsert.push({
          page_id: pageId,
          type: PageBlockType.DATABASE_VIEW,
          title: item.title,
          order_index: orderIndex,
          style_config: null,
          data_config: {
            workspace_id: board.workspaceId,
            project_id: board.projectId,
            default_board_id: board.id,
            default_view_type: board.viewType,
          },
          created_by: createdBy,
          content: null,
        });

        orderIndex += 1;
      }
    }

    if (blocksToInsert.length > 0) {
      const entities = manager.getRepository(PageBlock).create(blocksToInsert);
      await manager.save(PageBlock, entities);
    }
  }

  private buildTemplateStatusKey(
    projectTemplateKey: string,
    name: string,
  ): string {
    return `${projectTemplateKey}::${name}`;
  }

  private async createManyTaskMetadata({
    workspaceId,
    statuses,
    priorities,
    projectMap,
    manager,
  }: {
    workspaceId: string;
    statuses: TemplateTaskStatusConfig[];
    priorities: TemplateTaskPriorityConfig[];
    projectMap: Map<string, ProjectModel>;
    manager: EntityManager;
  }): Promise<{
    statusMap: Map<string, { id: string }>;
    priorityMap: Map<string, { id: string }>;
  }> {
    const statusMap = new Map<string, { id: string }>();
    const priorityMap = new Map<string, { id: string }>();

    for (const status of statuses) {
      const project = projectMap.get(status.projectTemplateKey);
      if (!project) {
        throw new BadRequestException(
          `Project template key ${status.projectTemplateKey} not found for status ${status.name}`,
        );
      }

      const createdStatus = await this.createTaskStatusService.create(
        {
          workspaceId,
          projectId: project.id,
          name: status.name,
          position: status.position ?? 0,
          color: status.color ?? null,
          isDone: status.name.trim().toLowerCase() === 'done',
        },
        manager,
      );

      statusMap.set(
        this.buildTemplateStatusKey(status.projectTemplateKey, status.name),
        createdStatus,
      );
    }

    for (const priority of priorities) {
      const project = projectMap.get(priority.projectTemplateKey);
      if (!project) {
        throw new BadRequestException(
          `Project template key ${priority.projectTemplateKey} not found for priority ${priority.name}`,
        );
      }

      const createdPriority = await this.createTaskPriorityService.create(
        {
          workspaceId,
          projectId: project.id,
          name: priority.name,
          level: priority.level ?? 0,
          color: priority.color ?? null,
        },
        manager,
      );

      priorityMap.set(
        this.buildTemplateStatusKey(priority.projectTemplateKey, priority.name),
        createdPriority,
      );
    }

    return {
      statusMap,
      priorityMap,
    };
  }

  private async createManyTasks({
    workspaceId,
    tasks,
    projectMap,
    statusMap,
    priorityMap,
    userId,
    manager,
  }: {
    workspaceId: string;
    tasks: TemplateTaskConfig[];
    projectMap: Map<string, ProjectModel>;
    statusMap: Map<string, { id: string }>;
    priorityMap: Map<string, { id: string }>;
    userId: string;
    manager: EntityManager;
  }): Promise<void> {
    if (!tasks.length) return;

    const projectSeqMap = new Map<string, number>();
    const createTaskPayload = tasks.map((task) => {
      const project = projectMap.get(task.projectTemplateKey);
      if (!project) {
        throw new BadRequestException(
          `Project template key ${task.projectTemplateKey} not found for task ${task.title}`,
        );
      }

      const status = statusMap.get(
        this.buildTemplateStatusKey(task.projectTemplateKey, task.statusName),
      );
      if (!status) {
        throw new BadRequestException(
          `Status ${task.statusName} not found for project template key ${task.projectTemplateKey}`,
        );
      }

      const priority = task.priorityName
        ? priorityMap.get(
            this.buildTemplateStatusKey(
              task.projectTemplateKey,
              task.priorityName,
            ),
          )
        : null;

      if (task.priorityName && !priority) {
        throw new BadRequestException(
          `Priority ${task.priorityName} not found for project template key ${task.projectTemplateKey}`,
        );
      }

      const currentSeq = projectSeqMap.get(project.id) ?? 0;
      const nextSeq = currentSeq + 1;
      projectSeqMap.set(project.id, nextSeq);

      return {
        workspaceId,
        projectId: project.id,
        projectSeq: nextSeq,
        title: task.title,
        description: task.description ?? null,
        statusId: status.id,
        priorityId: priority?.id ?? null,
        createdBy: userId,
        estimateMinutes: task.estimateMinutes ?? null,
      };
    });

    await this.createTaskService.createMany(createTaskPayload, manager);
  }

  create(
    userId: string,
    input: CreateWorkspaceWithTemplateInput,
  ): Promise<WorkspaceModel> {
    return this.uow.runInTransaction(async (manager) => {
      await this.checkWorkspaceLimitService.checkCanCreateWorkspace(
        userId,
        manager,
      );

      let templateConfig: WorkspaceTemplateConfig;

      let pageTemplateId: string | null = null;

      if (input.templateId) {
        const template = await this.workspaceTemplatesService.findOne(input.templateId);
        templateConfig = template.config;
        pageTemplateId = template.pageTemplateId ?? null;
      } else {
        // Fallback or handle cases without template ID if needed
        templateConfig = this.getTemplateConfig({
          template: WorkspaceTemplateType.TASK_TRACKER,
          workspaceName: input.name,
        });
      }

      const { workspace } = await this.createWorkspaceCore({
        name: input.name,
        planType: input.planType,
        userId,
        manager,
      });

      await this.checkWorkspaceLimitService.applyBillingForNewWorkspace(
        userId,
        workspace.id,
        manager,
      );

      const createdPage = await this.createWorkspacePage({
        workspace,
        userId,
        manager,
      });

      const projectMap = await this.createManyProjects({
        workspaceId: workspace.id,
        userId,
        projects: templateConfig.projects,
        manager,
      });

      const boardMap = await this.createManyBoards({
        workspaceId: workspace.id,
        userId,
        boards: templateConfig.boards,
        projectMap,
        manager,
      });

      await this.createManyPageBlocks({
        pageId: createdPage.id,
        createdBy: userId,
        templateId: pageTemplateId,
        pageBlocks: templateConfig.pageBlocks,
        boardMap,
        manager,
      });

      const { statusMap, priorityMap } = await this.createManyTaskMetadata({
        workspaceId: workspace.id,
        statuses: templateConfig.statuses,
        priorities: templateConfig.priorities,
        projectMap,
        manager,
      });

      await this.createManyTasks({
        workspaceId: workspace.id,
        tasks: templateConfig.tasks,
        projectMap,
        statusMap,
        priorityMap,
        userId,
        manager,
      });

      return workspace;
    });
  }
}
