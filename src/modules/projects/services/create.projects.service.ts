import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { BoardViewType } from 'src/modules/boards/domain/entities/board.entity';
import { BoardModel } from 'src/modules/boards/domain/models/board.model';
import { type CreateBoardService } from 'src/modules/boards/interfaces/services/create.board.service.interface';
import { BOARD_TYPES } from 'src/modules/boards/interfaces/types';
import { type UsageLimitEnforcerService } from 'src/modules/billing/interfaces/services/usage-limit/usage-limit-enforcer.service.interface';
import { BILLING_TYPES } from 'src/modules/billing/interfaces/types';
import { type FindPageService } from 'src/modules/page/interfaces/services/find-page.service.interface';
import { PAGE_TYPES } from 'src/modules/page/interfaces/types';
import { PageBlockType } from 'src/modules/page_block/domain/entities/page_block.entity';
import { type CreatePageBlockService } from 'src/modules/page_block/interfaces/services/create.page_block.service.interface';
import { type FindPageBlockService } from 'src/modules/page_block/interfaces/services/find.page_block.service.interface';
import { PAGE_BLOCK_TYPES } from 'src/modules/page_block/interfaces/types';
import { type CreateTaskPriorityService } from 'src/modules/task_priority/interfaces/services/create.task_priority.service.interface';
import { TASK_PRIORITY_TYPES } from 'src/modules/task_priority/interfaces/types';
import { type CreateTaskStatusService } from 'src/modules/task_status/interfaces/services/create.task_status.service.interface';
import { TASK_STATUS_TYPES } from 'src/modules/task_status/interfaces/types';
import { type CreateTaskService } from 'src/modules/tasks/interfaces/services/create-task.service.interface';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { EntityManager } from 'typeorm';
import { ProjectModel } from '../domain/models/projects.model';
import { CreateProjectDto } from '../dto/create-project.dto';
import { type CreateProjectRepository } from '../interfaces/repositories/create.project.repository.interface';
import { type FindProjectRepository } from '../interfaces/repositories/find.project.repository.interface';
import { CreateProjectService } from '../interfaces/services/create.project.service.interface';
import { PROJECT_TYPES } from '../interfaces/types';

@Injectable()
export class CreateProjectServiceImpl implements CreateProjectService {
  constructor(
    @Inject(PROJECT_TYPES.repositories.CreateProjectRepository)
    private readonly repo: CreateProjectRepository,

    @Inject(PROJECT_TYPES.repositories.FindProjectRepository)
    private readonly findProjectRepository: FindProjectRepository,

    @Inject(PAGE_TYPES.services.FindPageService)
    private readonly findPageService: FindPageService,

    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(BOARD_TYPES.services.CreateBoardService)
    private readonly createBoardService: CreateBoardService,

    @Inject(PAGE_BLOCK_TYPES.services.CreatePageBlockService)
    private readonly createPageBlockService: CreatePageBlockService,

    @Inject(PAGE_BLOCK_TYPES.services.FindPageBlockService)
    private readonly findPageBlockService: FindPageBlockService,

    @Inject(TASK_STATUS_TYPES.services.CreateTaskStatusService)
    private readonly createTaskStatusService: CreateTaskStatusService,

    @Inject(TASK_PRIORITY_TYPES.services.CreateTaskPriorityService)
    private readonly createTaskPriorityService: CreateTaskPriorityService,

    @Inject(TASK_TYPES.services.CreateTaskService)
    private readonly createTaskService: CreateTaskService,

    @Inject(BILLING_TYPES.services.UsageLimitEnforcerService)
    private readonly usageLimitEnforcerService: UsageLimitEnforcerService,
  ) {}

  create(
    createProjectDto: CreateProjectDto & { created_by?: string },
    manager: EntityManager,
  ): Promise<ProjectModel> {
    const userId = createProjectDto.created_by || 'sys';
    const key = `${createProjectDto.name.trim()}-${userId.slice(0, 4)}-${Date.now()}`;
    const create = this.repo.save({
      ...createProjectDto,
      created_by: userId,
      key,
    }, manager);
    return create;
  }

  async createProjectWithPageBlock(
    createProjectDto: CreateProjectDto & { created_by?: string },
  ): Promise<ProjectModel> {
    const workspaceId = createProjectDto.workspace_id;
    const userId = createProjectDto.created_by || 'sys';
    const nameProject = createProjectDto.name.trim();
    const key = `${nameProject}-${userId.slice(0, 4)}-${Date.now()}`;

    return this.uow.runInTransaction(async (manager) => {
      await this.usageLimitEnforcerService.checkProjectLimit(
        workspaceId,
        manager,
      );

      const project = await this.repo.save(
        {
          ...createProjectDto,
          key,
          workspace_id: workspaceId,
          created_by: userId,
        },
        manager,
      );

      let board: BoardModel | null = null;
      const initialView =
        createProjectDto.default_board_view_type ?? BoardViewType.BOARD;

      if (createProjectDto.create_default_board) {
        board = await this.createBoardService.create(
          {
            workspaceId,
            projectId: project.id,
            name: project.name,
            createdBy: userId,
            viewType: initialView,
          },
          manager,
        );
      }

      const createdStatuses = await this.createTaskStatusService.createMany(
        [
          {
            workspaceId,
            projectId: project.id,
            name: 'Todo',
            position: 0,
            color: '#94A3B8',
            isDone: false,
          },
          {
            workspaceId,
            projectId: project.id,
            name: 'In Progress',
            position: 1,
            color: '#3B82F6',
            isDone: false,
          },
          {
            workspaceId,
            projectId: project.id,
            name: 'Done',
            position: 2,
            color: '#22C55E',
            isDone: true,
          },
        ],
        manager,
      );

      const createdPriorities = await this.createTaskPriorityService.createMany(
        [
          {
            workspaceId,
            projectId: project.id,
            name: 'Low',
            level: 1,
            color: '#94A3B8',
          },
          {
            workspaceId,
            projectId: project.id,
            name: 'Medium',
            level: 2,
            color: '#3B82F6',
          },
          {
            workspaceId,
            projectId: project.id,
            name: 'High',
            level: 3,
            color: '#F59E0B',
          },
          {
            workspaceId,
            projectId: project.id,
            name: 'Urgent',
            level: 4,
            color: '#EF4444',
          },
        ],
        manager,
      );

      if (createProjectDto.create_default_board) {
        const todoStatus = createdStatuses.find((item) => item.name === 'Todo');
        const inProgressStatus = createdStatuses.find(
          (item) => item.name === 'In Progress',
        );
        const doneStatus = createdStatuses.find((item) => item.name === 'Done');

        const lowPriority = createdPriorities.find(
          (item) => item.name === 'Low',
        );
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

        await this.createTaskService.createMany(
          [
            {
              workspaceId,
              projectId: project.id,
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
              projectId: project.id,
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
              projectId: project.id,
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
      }

      const page = await this.findPageService.findPageByWorkspaceId(
        workspaceId,
        manager,
      );

      if (page) {
        const nextOrderIndex =
          await this.findPageBlockService.getNextOrderIndex(page.id, manager);

        await this.createPageBlockService.create(
          {
            page_id: page.id,
            type: PageBlockType.DATABASE_VIEW,
            title: project.name,
            position_x: 0,
            position_y: 0,
            width: 12,
            height: 1,
            order_index: nextOrderIndex,
            style_config: null,
            data_config: {
              project_id: project.id,
              workspace_id: workspaceId,
              default_board_id: board?.id ?? null,
              default_view_type: board?.viewType ?? initialView,
            },
            created_by: userId,
            content: null,
          },
          manager,
        );
      }

      await this.usageLimitEnforcerService.syncProjectUsedValue(
        workspaceId,
        manager,
      );

      return project;
    });
  }
}
