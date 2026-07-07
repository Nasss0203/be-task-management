import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { PROJECT_TYPES } from 'src/modules/projects/interfaces/types';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { type CreateWorkspaceTemplateService } from 'src/modules/workspaces/interfaces/services/create-workspace-template.service.interface';
import { ProjectVisibility } from 'src/modules/projects/domain/entities/project.entity';
import { type CreateProjectService } from 'src/modules/projects/interfaces/services/create.project.service.interface';
import { type CreateTaskService } from 'src/modules/tasks/interfaces/services/create-task.service.interface';
import { AiGenerationStatus } from '../domain/enums/ai-generation-status.enum';
import { AiGenerationType } from '../domain/enums/ai-generation-type.enum';
import { AiAppliedEntityType } from '../domain/enums/ai-applied-entity-type.enum';
import { AiGenerationResponseDto } from '../dto/response/ai-generation.response.dto';
import { ApplyAiGenerationApplication } from '../interfaces/applications/apply-ai-generation.application.interface';
import { type AiGenerationService } from '../interfaces/services/ai-generation.service.interface';
import { AI_ASSISTANT_TYPES } from '../interfaces/types';
import { AiGenerationMapper } from '../mapper/ai-generation.mapper';
import { AiWorkspaceTreeDraft } from '../interfaces/types/ai-workspace-tree-draft.type';


interface WorkspaceDraftOutput {
  name: string;
  slug?: string;
}

interface ProjectDraftOutput {
  name: string;
  key: string;
  visibility: string;
  description?: string;
}

interface TaskDraftOutput {
  title: string;
  description?: string;
  priority?: string;
  estimatedHours?: number;
}

@Injectable()
export class ApplyAiGenerationApplicationImpl implements ApplyAiGenerationApplication {
  constructor(
    @Inject(AI_ASSISTANT_TYPES.services.AiGenerationService)
    private readonly generationService: AiGenerationService,

    @Inject(WORKSPACE_TYPES.services.CreateWorkspaceTemplateService)
    private readonly createWorkspaceTemplateService: CreateWorkspaceTemplateService,

    @Inject(PROJECT_TYPES.services.CreateProjectService)
    private readonly createProjectService: CreateProjectService,

    @Inject(TASK_TYPES.services.CreateTaskService)
    private readonly createTaskService: CreateTaskService,

    private readonly dataSource: DataSource,
  ) {}

  async apply(
    input: Parameters<ApplyAiGenerationApplication['apply']>[0],
  ): Promise<AiGenerationResponseDto> {
    const generation = await this.generationService.findByIdForUser(
      input.generationId,
      input.userId,
    );

    if (generation.status !== AiGenerationStatus.GENERATED) {
      throw new ConflictException(
        'Only generated AI generations can be applied',
      );
    }

    const outputData = generation.outputData;
    if (!outputData) {
      throw new BadRequestException('No generated output data found to apply');
    }

    let appliedResults = input.dto.appliedResults || [];

    try {
      if (appliedResults.length === 0) {
        if (generation.generationType === AiGenerationType.WORKSPACE_DRAFT) {
          const draft = outputData as unknown as WorkspaceDraftOutput;
          const name = draft.name;
          if (!name) {
            throw new BadRequestException('Workspace name is missing from draft');
          }
          const workspace = await this.createWorkspaceTemplateService.create(
            input.userId,
            { name },
          );
          appliedResults = [
            {
              entityType: AiAppliedEntityType.WORKSPACE,
              entityId: workspace.id,
              action: 'CREATE',
              metadata: { name: workspace.name, slug: workspace.slug },
            },
          ];
        } else if (generation.generationType === AiGenerationType.PROJECT_DRAFT) {
          const draft = outputData as unknown as ProjectDraftOutput & { tasks?: TaskDraftOutput[] };
          const name = draft.name;
          const key = draft.key;
          const visibility = draft.visibility as ProjectVisibility;
          const description = draft.description || '';

          const workspaceId = generation.workspaceId;
          if (!workspaceId) {
            throw new BadRequestException(
              'Workspace context is required to apply project draft',
            );
          }

          const tempResults: any[] = [];

          await this.dataSource.transaction(async (transactionalEntityManager) => {
            const project =
              await this.createProjectService.createProjectWithPageBlock(
                {
                  workspace_id: workspaceId,
                  name,
                  visibility,
                  key,
                  created_by: input.userId,
                  create_default_board: true,
                },
                transactionalEntityManager,
              );

            tempResults.push({
              entityType: AiAppliedEntityType.PROJECT,
              entityId: project.id,
              action: 'CREATE',
              metadata: { name: project.name, key: project.key, description },
            });

            if (draft.tasks && draft.tasks.length > 0) {
              // Find default status for the project
              const statusRows = (await transactionalEntityManager.query(
                `SELECT id FROM task_statuses WHERE project_id = $1 ORDER BY name = 'Todo' DESC, created_at ASC LIMIT 1`,
                [project.id],
              )) as unknown as Array<{ id: string }>;

              if (!statusRows || statusRows.length === 0) {
                throw new BadRequestException(
                  'No task status found for this project',
                );
              }
              const statusId = statusRows[0].id;

              for (const taskDraft of draft.tasks) {
                const title = taskDraft.title;
                const taskDesc = taskDraft.description || '';
                const priorityName = taskDraft.priority;
                const estimatedHours = taskDraft.estimatedHours;

                let priorityId: string | null = null;
                if (priorityName) {
                  const formattedPriority =
                    priorityName.charAt(0).toUpperCase() +
                    priorityName.slice(1).toLowerCase();
                  const priorityRows = (await transactionalEntityManager.query(
                    `SELECT id FROM task_priorities WHERE project_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
                    [project.id, formattedPriority],
                  )) as unknown as Array<{ id: string }>;

                  if (priorityRows && priorityRows.length > 0) {
                    priorityId = priorityRows[0].id;
                  }
                }

                const task = await this.createTaskService.create(
                  {
                    workspaceId,
                    projectId: project.id,
                    title,
                    description: taskDesc || null,
                    statusId,
                    priorityId,
                    estimateMinutes: estimatedHours ? estimatedHours * 60 : null,
                    createdBy: input.userId,
                  },
                  transactionalEntityManager,
                );

                tempResults.push({
                  entityType: AiAppliedEntityType.TASK,
                  entityId: task.id,
                  action: 'CREATE',
                  metadata: { title: task.title },
                });
              }
            }
          });

          appliedResults = tempResults;
        } else if (generation.generationType === AiGenerationType.TASK_DRAFT) {
          const workspaceId = generation.workspaceId;
          let projectId = generation.projectId;
          if (!workspaceId) {
            throw new BadRequestException(
              'Workspace context is required to apply task draft',
            );
          }

          const draft = outputData as unknown as { tasks: TaskDraftOutput[] };
          if (!draft.tasks || !Array.isArray(draft.tasks)) {
            throw new BadRequestException('Invalid task draft output structure');
          }

          const tempResults: any[] = [];

          await this.dataSource.transaction(async (transactionalEntityManager) => {
            if (!projectId) {
              // Find if there is any project in the workspace
              const projectRows = (await transactionalEntityManager.query(
                `SELECT id FROM projects WHERE workspace_id = $1 ORDER BY created_at ASC LIMIT 1`,
                [workspaceId],
              )) as unknown as Array<{ id: string }>;

              if (projectRows && projectRows.length > 0) {
                projectId = projectRows[0].id;
              } else {
                // Automatically create a default project
                const workspaceRows = (await transactionalEntityManager.query(
                  `SELECT name FROM workspaces WHERE id = $1 LIMIT 1`,
                  [workspaceId],
                )) as unknown as Array<{ name: string }>;
                const workspaceName = workspaceRows?.[0]?.name || 'Workspace';

                const newProject = await this.createProjectService.createProjectWithPageBlock(
                  {
                    workspace_id: workspaceId,
                    name: `${workspaceName} - Project`,
                    visibility: 'PRIVATE' as any,
                    key: 'PROJ',
                    created_by: input.userId,
                    create_default_board: true,
                  },
                  transactionalEntityManager,
                );
                projectId = newProject.id;

                tempResults.push({
                  entityType: AiAppliedEntityType.PROJECT,
                  entityId: newProject.id,
                  action: 'CREATE',
                  metadata: { name: newProject.name, key: newProject.key },
                });
              }
            }

            // Find default status for the project
            const statusRows = (await transactionalEntityManager.query(
              `SELECT id FROM task_statuses WHERE project_id = $1 ORDER BY name = 'Todo' DESC, created_at ASC LIMIT 1`,
              [projectId],
            )) as unknown as Array<{ id: string }>;

            if (!statusRows || statusRows.length === 0) {
              throw new BadRequestException(
                'No task status found for this project',
              );
            }
            const statusId = statusRows[0].id;

            for (const taskDraft of draft.tasks) {
              const title = taskDraft.title;
              const description = taskDraft.description || '';
              const priorityName = taskDraft.priority;
              const estimatedHours = taskDraft.estimatedHours;

              // Map priority name to project priority in DB
              let priorityId: string | null = null;
              if (priorityName) {
                const formattedPriority =
                  priorityName.charAt(0).toUpperCase() +
                  priorityName.slice(1).toLowerCase();
                const priorityRows = (await transactionalEntityManager.query(
                  `SELECT id FROM task_priorities WHERE project_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
                  [projectId, formattedPriority],
                )) as unknown as Array<{ id: string }>;

                if (priorityRows && priorityRows.length > 0) {
                  priorityId = priorityRows[0].id;
                }
              }

              const task = await this.createTaskService.create(
                {
                  workspaceId,
                  projectId,
                  title,
                  description: description || null,
                  statusId,
                  priorityId,
                  estimateMinutes: estimatedHours ? estimatedHours * 60 : null,
                  createdBy: input.userId,
                },
                transactionalEntityManager,
              );

              tempResults.push({
                entityType: AiAppliedEntityType.TASK,
                entityId: task.id,
                action: 'CREATE',
                metadata: { title: task.title },
              });
            }
          });

          appliedResults = tempResults;
        } else if (generation.generationType === AiGenerationType.WORKSPACE_TREE_DRAFT) {
          const draft = outputData as unknown as AiWorkspaceTreeDraft;
          const tempResults: any[] = [];

          await this.dataSource.transaction(async (transactionalEntityManager) => {
            for (const wsDraft of draft.workspaces) {
              const workspace = await this.createWorkspaceTemplateService.create(
                input.userId,
                { name: wsDraft.name },
                transactionalEntityManager,
              );
              tempResults.push({
                entityType: AiAppliedEntityType.WORKSPACE,
                entityId: workspace.id,
                action: 'CREATE',
                metadata: { name: workspace.name, slug: workspace.slug },
              });

              for (const projDraft of wsDraft.projects) {
                const project = await this.createProjectService.createProjectWithPageBlock(
                  {
                    workspace_id: workspace.id,
                    name: projDraft.name,
                    visibility: projDraft.visibility as ProjectVisibility,
                    key: projDraft.key,
                    created_by: input.userId,
                    create_default_board: true,
                  },
                  transactionalEntityManager,
                );

                tempResults.push({
                  entityType: AiAppliedEntityType.PROJECT,
                  entityId: project.id,
                  action: 'CREATE',
                  metadata: { name: project.name, key: project.key, description: projDraft.description },
                });

                // Find default status for the project
                const statusRows = (await transactionalEntityManager.query(
                  `SELECT id FROM task_statuses WHERE project_id = $1 ORDER BY name = 'Todo' DESC, created_at ASC LIMIT 1`,
                  [project.id],
                )) as unknown as Array<{ id: string }>;

                if (!statusRows || statusRows.length === 0) {
                  throw new BadRequestException(
                    'No task status found for this project',
                  );
                }
                const statusId = statusRows[0].id;

                for (const taskDraft of projDraft.tasks) {
                  let priorityId: string | null = null;
                  if (taskDraft.priority) {
                    const formattedPriority =
                      taskDraft.priority.charAt(0).toUpperCase() +
                      taskDraft.priority.slice(1).toLowerCase();
                    const priorityRows = (await transactionalEntityManager.query(
                      `SELECT id FROM task_priorities WHERE project_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
                      [project.id, formattedPriority],
                    )) as unknown as Array<{ id: string }>;

                    if (priorityRows && priorityRows.length > 0) {
                      priorityId = priorityRows[0].id;
                    }
                  }

                  const task = await this.createTaskService.create(
                    {
                      workspaceId: workspace.id,
                      projectId: project.id,
                      title: taskDraft.title,
                      description: taskDraft.description || null,
                      statusId,
                      priorityId,
                      estimateMinutes: taskDraft.estimatedHours ? taskDraft.estimatedHours * 60 : null,
                      createdBy: input.userId,
                    },
                    transactionalEntityManager,
                  );

                  tempResults.push({
                    entityType: AiAppliedEntityType.TASK,
                    entityId: task.id,
                    action: 'CREATE',
                    metadata: { title: task.title },
                  });
                }
              }
            }
          });

          appliedResults = tempResults;
        }
      }

      const updated = await this.generationService.updateAppliedResults({
        id: generation.id,
        userId: input.userId,
        appliedResults,
        appliedAt: new Date(),
        status: AiGenerationStatus.APPLIED,
      });

      return AiGenerationMapper.toResponse(updated);
    } catch (error) {
      await this.generationService.updateStatus({
        id: generation.id,
        userId: input.userId,
        status: AiGenerationStatus.APPLY_BLOCKED,
        errorMessage: error instanceof Error ? error.message : 'Apply blocked due to quota or creation error',
      });

      throw new ConflictException(
        error instanceof Error ? error.message : 'Apply blocked due to quota or creation error',
      );
    }
  }
}

