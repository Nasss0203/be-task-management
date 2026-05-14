export const TASK_TYPES = {
  services: {
    CreateTaskService: 'CreateTaskService',
    UpdateTaskService: 'UpdateTaskService',
    FindTaskService: 'FindTaskService',
    MoveTaskSprintService: 'MoveTaskSprintService',
    DeleteTaskService: 'DeleteTaskService',
    RemoveTaskFromSprintService: 'RemoveTaskFromSprintService',
    MoveUnfinishedTasksToBacklogService: 'MoveUnfinishedTasksToBacklogService',
    MarkDoneTasksCompletedAtInSprintService:
      'MarkDoneTasksCompletedAtInSprintService',
    MoveTasksToBacklogBySprintService: 'MoveTasksToBacklogBySprintService',
    MoveTaskSprintToSprintService: 'MoveTaskSprintToSprintService',
  },
  applications: {
    CreateTaskApplication: 'CreateTaskApplication',
    UpdateTaskApplication: 'UpdateTaskApplication',
    FindTaskApplication: 'FindTaskApplication',
    MoveTaskSprintApplication: 'MoveTaskSprintApplication',
    DeleteTaskApplication: 'DeleteTaskApplication',
    RemoveTaskFromSprintApplication: 'RemoveTaskFromSprintApplication',
    MoveTaskSprintToSprintApplication: 'MoveTaskSprintToSprintApplication',
  },
  repositories: {
    CreateTaskRepository: 'CreateTaskRepository',
    UpdateTaskRepository: 'UpdateTaskRepository',
    FindTaskRepository: 'FindTaskRepository',
    MoveTaskSprintRepository: 'MoveTaskSprintRepository',
    DeleteTaskRepository: 'DeleteTaskRepository',
    MoveUnfinishedTasksToBacklogRepository:
      'MoveUnfinishedTasksToBacklogRepository',
    MarkDoneTasksCompletedAtInSprintRepository:
      'MarkDoneTasksCompletedAtInSprintRepository',
    MoveTasksToBacklogBySprintRepository:
      'MoveTasksToBacklogBySprintRepository',
    MoveTaskSprintToSprintRepository: 'MoveTaskSprintToSprintRepository',
  },
};
