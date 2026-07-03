export const TASK_POSITION_TYPES = {
  repositories: {
    FindOneTaskPositionRepository: 'FindOneTaskPositionRepository',
    FindFirstTaskPositionRepository: 'FindFirstTaskPositionRepository',
    FindLastTaskPositionRepository: 'FindLastTaskPositionRepository',
    FindAllTaskPositionsRepository: 'FindAllTaskPositionsRepository',
    CreateTaskPositionRepository: 'CreateTaskPositionRepository',
    UpsertTaskPositionRepository: 'UpsertTaskPositionRepository',
    UpdateTaskPositionRepository: 'UpdateTaskPositionRepository',
    DeleteTaskPositionRepository: 'DeleteTaskPositionRepository',
    UpdateManyTaskPositionsRepository: 'UpdateManyTaskPositionsRepository',
  },
  services: {
    CreateAtEndTaskPositionService: 'CreateAtEndTaskPositionService',
    ReorderWithinContextTaskPositionService:
      'ReorderWithinContextTaskPositionService',
    RemoveTaskPositionFromContextService:
      'RemoveTaskPositionFromContextService',
    InitializeTaskPositionsService: 'InitializeTaskPositionsService',
    NormalizeTaskPositionContextService: 'NormalizeTaskPositionContextService',
  },
};

export type { PositionContextRef } from './task-position.input';
