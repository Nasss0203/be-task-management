import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  AiContextSnapshotRepository,
  ResolveAiTaskDraftContextInput,
  ResolvedAiTaskDraftContext,
} from '../interfaces/repositories/ai-context-snapshot.repository.interface';

type WorkspaceRow = {
  id: string;
  name: string;
};

type ProjectRow = {
  id: string;
  workspaceId: string;
  name: string;
};

type BoardRow = {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
};

type SprintRow = {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
};

@Injectable()
export class AiContextSnapshotRepositoryImpl implements AiContextSnapshotRepository {
  constructor(private readonly dataSource: DataSource) {}

  async resolveTaskDraftContext(
    input: ResolveAiTaskDraftContextInput,
  ): Promise<ResolvedAiTaskDraftContext> {
    let workspaceId = input.workspaceId ?? null;
    let projectId = input.projectId ?? null;

    const board = input.boardId ? await this.findBoard(input.boardId) : null;
    const sprint = input.sprintId
      ? await this.findSprint(input.sprintId)
      : null;
    let project = projectId ? await this.findProject(projectId) : null;

    if (input.boardId && !board) {
      throw new BadRequestException('Board context not found');
    }

    if (input.sprintId && !sprint) {
      throw new BadRequestException('Sprint context not found');
    }

    if (projectId && !project) {
      throw new BadRequestException('Project context not found');
    }

    workspaceId = this.mergeWorkspaceId(workspaceId, project?.workspaceId);
    workspaceId = this.mergeWorkspaceId(workspaceId, board?.workspaceId);
    workspaceId = this.mergeWorkspaceId(workspaceId, sprint?.workspaceId);

    projectId = this.mergeProjectId(projectId, board?.projectId);
    projectId = this.mergeProjectId(projectId, sprint?.projectId);

    if (!workspaceId) {
      throw new BadRequestException('workspaceId is required for task draft');
    }

    const workspace = await this.findWorkspace(workspaceId);

    if (!workspace) {
      throw new BadRequestException('Workspace context not found');
    }

    if (projectId && !project) {
      project = await this.findProject(projectId);
    }

    if (projectId && !project) {
      throw new BadRequestException('Project context not found');
    }

    if (project && project.workspaceId !== workspaceId) {
      throw new BadRequestException('Project does not belong to workspace');
    }

    return {
      context: {
        workspaceId,
        projectId,
        boardId: board?.id ?? null,
        sprintId: sprint?.id ?? null,
        metadata: input.metadata ?? null,
      },
      contextSnapshot: {
        workspaceName: workspace.name,
        projectName: project?.name ?? null,
        boardName: board?.name ?? null,
        sprintName: sprint?.name ?? null,
      },
    };
  }

  private mergeWorkspaceId(
    current: string | null,
    candidate?: string | null,
  ): string | null {
    if (!candidate) {
      return current;
    }

    if (current && current !== candidate) {
      throw new BadRequestException('AI context workspace mismatch');
    }

    return candidate;
  }

  private mergeProjectId(
    current: string | null,
    candidate?: string | null,
  ): string | null {
    if (!candidate) {
      return current;
    }

    if (current && current !== candidate) {
      throw new BadRequestException('AI context project mismatch');
    }

    return candidate;
  }

  private async findWorkspace(id: string): Promise<WorkspaceRow | null> {
    const rows = await this.dataSource.query<WorkspaceRow[]>(
      `
        SELECT id, name
        FROM workspaces
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [id],
    );

    return rows[0] ?? null;
  }

  private async findProject(id: string): Promise<ProjectRow | null> {
    const rows = await this.dataSource.query<ProjectRow[]>(
      `
        SELECT
          id,
          workspace_id AS "workspaceId",
          name
        FROM projects
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [id],
    );

    return rows[0] ?? null;
  }

  private async findBoard(id: string): Promise<BoardRow | null> {
    const rows = await this.dataSource.query<BoardRow[]>(
      `
        SELECT
          id,
          workspace_id AS "workspaceId",
          project_id AS "projectId",
          name
        FROM boards
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [id],
    );

    return rows[0] ?? null;
  }

  private async findSprint(id: string): Promise<SprintRow | null> {
    const rows = await this.dataSource.query<SprintRow[]>(
      `
        SELECT
          id,
          workspace_id AS "workspaceId",
          project_id AS "projectId",
          name
        FROM sprints
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      [id],
    );

    return rows[0] ?? null;
  }
}
