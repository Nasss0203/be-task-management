import { TaskModel } from '../../domain/models/task.model';

export interface FindTaskService {
  findAllTask(projectId: string, workspaceId: string): Promise<TaskModel[]>;
  findAllTaskByWorkspace(workspaceId: string): Promise<TaskModel[]>;
}
