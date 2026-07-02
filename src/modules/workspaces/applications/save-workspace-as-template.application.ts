import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { UnitOfWork } from 'src/interface/index.interface';
import { EntityManager } from 'typeorm';

import { SaveWorkspaceAsTemplateApplication, SaveWorkspaceAsTemplateCommand } from '../interfaces/applications/save-workspace-as-template.application.interface';
import { WORKSPACE_TYPES } from '../interfaces/types';
import type { FindWorkspaceApplication } from '../interfaces/applications/find.workspace.application.interface';

import { PAGE_TYPES } from 'src/modules/page/interfaces/types';
import type { FindPageService } from 'src/modules/page/interfaces/services/find-page.service.interface';

import { PAGE_BLOCK_TYPES } from 'src/modules/page_block/interfaces/types';
import type { FindPageBlockService } from 'src/modules/page_block/interfaces/services/find.page_block.service.interface';
import { PageBlockType } from 'src/modules/page_block/domain/entities/page_block.entity';

import { PROJECT_TYPES } from 'src/modules/projects/interfaces/types';
import type { FindProjectService } from 'src/modules/projects/interfaces/services/find.project.service.interface';

import { BOARD_TYPES } from 'src/modules/boards/interfaces/types';
import type { FindBoardService } from 'src/modules/boards/interfaces/services/find-board.service.interface';

import { TASK_STATUS_TYPES } from 'src/modules/task_status/interfaces/types';
import type { FindTaskStatusService } from 'src/modules/task_status/interfaces/services/find.task-status.service.interface';

import { TASK_PRIORITY_TYPES } from 'src/modules/task_priority/interfaces/types';
import type { FindTaskPriorityService } from 'src/modules/task_priority/interfaces/services/find.task-priority.service.interface';

import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import type { FindTaskService } from 'src/modules/tasks/interfaces/services/find-task.service.interface';
import { TaskModel } from 'src/modules/tasks/domain/models/task.model';
import { BoardModel } from 'src/modules/boards/domain/models/board.model';
import { TaskStatusModel } from 'src/modules/task_status/domain/models/task_status.model';
import { TaskPriorityModel } from 'src/modules/task_priority/domain/models/task_priority.models';

// Entities for saving directly via manager
import { PageTemplate } from 'src/modules/page_templates/domain/entities/page_template.entity';
import { WorkspaceTemplate } from 'src/modules/workspace_templates/domain/entities/workspace_template.entity';
import { PageTemplateBlock } from 'src/modules/page_template_blocks/domain/entities/page_template_block.entity';
import {
  WorkspaceTemplateConfig,
  TemplateProjectConfig,
  TemplateBoardConfig,
  TemplateTaskStatusConfig,
  TemplateTaskPriorityConfig,
  TemplateTaskConfig,
  TemplatePageBlockConfig
} from '../types/types';
import { TemplateStatus } from 'src/common/enum/template.enum';

@Injectable()
export class SaveWorkspaceAsTemplateApplicationImpl implements SaveWorkspaceAsTemplateApplication {
  constructor(
    @Inject(WORKSPACE_TYPES.uow.UnitOfWork)
    private readonly uow: UnitOfWork,

    @Inject(WORKSPACE_TYPES.applications.FindWorkspaceApplication)
    private readonly findWorkspaceApplication: FindWorkspaceApplication,

    @Inject(PAGE_TYPES.services.FindPageService)
    private readonly findPageService: FindPageService,

    @Inject(PAGE_BLOCK_TYPES.services.FindPageBlockService)
    private readonly findPageBlockService: FindPageBlockService,

    @Inject(PROJECT_TYPES.services.FindProjectService)
    private readonly findProjectService: FindProjectService,

    @Inject(BOARD_TYPES.services.FindBoardService)
    private readonly findBoardService: FindBoardService,

    @Inject(TASK_STATUS_TYPES.services.FindTaskStatusService)
    private readonly findTaskStatusService: FindTaskStatusService,

    @Inject(TASK_PRIORITY_TYPES.services.FindTaskPriorityService)
    private readonly findTaskPriorityService: FindTaskPriorityService,

    @Inject(TASK_TYPES.services.FindTaskService)
    private readonly findTaskService: FindTaskService,
  ) { }

  async save(command: SaveWorkspaceAsTemplateCommand) {
    const { userId, workspaceId, dto } = command;

    return this.uow.runInTransaction(async (manager) => {
      // 1. Validate Access
      await this.findWorkspaceApplication.findOneWorkspaceById(userId, workspaceId);

      // 2. Fetch the default canvas page
      const page = await this.findPageService.findPageByWorkspaceId(workspaceId, manager);
      if (!page) {
        throw new HttpException('Default canvas page not found for workspace', HttpStatus.NOT_FOUND);
      }

      // 3. Fetch dependencies
      const pageBlocks = await this.findPageBlockService.findAllByPageId(page.id, manager);
      const projects = await this.findProjectService.findAllByWorkspaceId(workspaceId);

      const boards: BoardModel[] = [];
      for (const p of projects) {
        const pBoards = await this.findBoardService.findAllByProjectId(p.id, workspaceId);
        boards.push(...pBoards);
      }

      const statuses: TaskStatusModel[] = [];
      for (const p of projects) {
        const pStatuses = await this.findTaskStatusService.findAllTaskStatus(p.id, workspaceId, manager);
        statuses.push(...pStatuses);
      }

      const priorities: TaskPriorityModel[] = [];
      for (const p of projects) {
        const pPriorities = await this.findTaskPriorityService.findAllTaskPriority(p.id, workspaceId, manager);
        priorities.push(...pPriorities);
      }

      const tasks: TaskModel[] = [];
      if (dto.includeSampleTasks) {
        const wTasks = await this.findTaskService.findAllTaskByWorkspace(workspaceId, manager);
        tasks.push(...wTasks);
      }

      // 4. Build Config & ID Maps
      const projectMap = new Map<string, string>(); // realId -> templateKey
      const boardMap = new Map<string, string>();
      const statusMap = new Map<string, string>(); // realId -> name
      const priorityMap = new Map<string, string>(); // realId -> name

      const configProjects: TemplateProjectConfig[] = [];
      projects.forEach((p, idx) => {
        const tKey = `project-${idx + 1}`;
        projectMap.set(p.id, tKey);
        configProjects.push({
          templateKey: tKey,
          name: p.name,
          key: p.key,
        });
      });

      const configBoards: TemplateBoardConfig[] = [];
      boards.forEach((b, idx) => {
        const tKey = `board-${idx + 1}`;
        boardMap.set(b.id, tKey);
        configBoards.push({
          templateKey: tKey,
          projectTemplateKey: projectMap.get(b.projectId) || '',
          name: b.name,
          viewType: b.viewType,
        });
      });

      const configStatuses: TemplateTaskStatusConfig[] = [];
      statuses.forEach((s) => {
        statusMap.set(s.id, s.name);
        configStatuses.push({
          projectTemplateKey: projectMap.get(s.projectId) || '',
          name: s.name,
          position: s.position,
          color: s.color,
        });
      });

      const configPriorities: TemplateTaskPriorityConfig[] = [];
      priorities.forEach((pr) => {
        priorityMap.set(pr.id, pr.name);
        configPriorities.push({
          projectTemplateKey: projectMap.get(pr.projectId) || '',
          name: pr.name,
          level: pr.level,
          color: pr.color,
        });
      });

      const configTasks: TemplateTaskConfig[] = [];
      tasks.forEach((t) => {
        configTasks.push({
          projectTemplateKey: projectMap.get(t.projectId) || '',
          title: t.title || 'Untitled',
          description: t.description,
          statusName: statusMap.get(t.statusId) || 'Todo',
          priorityName: t.priorityId ? priorityMap.get(t.priorityId) || 'Medium' : 'Medium',
          estimateMinutes: t.estimateMinutes || undefined,
        });
      });

      // 5. Create PageTemplate
      const pageTemplateId = uuidv4();
      await manager.insert(PageTemplate, {
        id: pageTemplateId,
        workspaceId,
        name: dto.name,
        description: dto.description,
        visibility: dto.visibility as any,
        isSystem: false,
        createdBy: userId,
      });

      // 6. Clone PageBlocks into PageTemplateBlocks
      const blockIdMap = new Map<string, string>();
      pageBlocks.forEach(b => {
        blockIdMap.set(b.id, uuidv4());
      });

      const templateBlocksToInsert = pageBlocks.map(b => {
        const newBlockId = blockIdMap.get(b.id);
        const newParentId = null; // No parentId in PageBlockModel

        // Handle DATABASE_VIEW config translation
        let newDataConfig = b.data_config ? JSON.parse(JSON.stringify(b.data_config)) : null;
        if (b.type === PageBlockType.DATABASE_VIEW && newDataConfig) {
          newDataConfig.projectTemplateKey = projectMap.get(newDataConfig.project_id) || newDataConfig.project_id;
          newDataConfig.boardTemplateKey = boardMap.get(newDataConfig.default_board_id) || newDataConfig.default_board_id;

          delete newDataConfig.workspace_id;
          delete newDataConfig.project_id;
          delete newDataConfig.default_board_id;
        }

        const templateContent = {
          title: b.title,
          content: b.content,
          dataConfig: newDataConfig,
          styles: b.style_config,
        };

        return {
          id: newBlockId,
          templateId: pageTemplateId,
          type: b.type,
          content: templateContent as Record<string, unknown>,
          parentBlockId: newParentId,
          orderIndex: b.order_index,
        } as any;
      });

      if (templateBlocksToInsert.length > 0) {
        await manager.insert(PageTemplateBlock, templateBlocksToInsert);
      }

      // We don't necessarily populate pageBlocks config if we copy them as TemplateBlocks. 
      // But we can leave it empty or map it if needed. The user spec says "create PageTemplateBlocks".
      const configSummaryObj: WorkspaceTemplateConfig = {
        projects: configProjects,
        boards: configBoards,
        pageBlocks: [], // If any specific block configs are needed
        statuses: configStatuses,
        priorities: configPriorities,
        tasks: configTasks,
      };

      // 7. Create WorkspaceTemplate
      const workspaceTemplateId = uuidv4();
      await manager.insert(WorkspaceTemplate, {
        id: workspaceTemplateId,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        config: configSummaryObj,
        isSystem: false,
        pageTemplateId: pageTemplateId,
        status: TemplateStatus.PUBLISHED, // Explicitly set to PUBLISHED so it shows up in GET APIs
        visibility: dto.visibility as any,
        createdBy: userId,
        workspaceId: workspaceId,
      });

      return {
        workspaceTemplateId,
        pageTemplateId,
        name: dto.name,
        visibility: dto.visibility,
        configSummary: {
          projects: projects.length,
          boards: boards.length,
          statuses: statuses.length,
          priorities: priorities.length,
          sampleTasks: tasks.length,
          blocks: pageBlocks.length,
        }
      };
    });
  }
}
