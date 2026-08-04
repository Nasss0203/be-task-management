import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskPositionController } from './controller/task_position.controller';
import { TaskPosition } from './domain/entities/task_position.entity';
import { TASK_POSITION_TYPES } from './interfaces/types';
import { CreateTaskPositionRepositoryImpl } from './repositories/create-task-position.repository';
import { DeleteTaskPositionRepositoryImpl } from './repositories/delete-task-position.repository';
import { FindAllTaskPositionsRepositoryImpl } from './repositories/find-all-task-positions.repository';
import { FindFirstTaskPositionRepositoryImpl } from './repositories/find-first-task-position.repository';
import { FindLastTaskPositionRepositoryImpl } from './repositories/find-last-task-position.repository';
import { FindOneTaskPositionRepositoryImpl } from './repositories/find-one-task-position.repository';
import { UpdateManyTaskPositionsRepositoryImpl } from './repositories/update-many-task-positions.repository';
import { UpdateTaskPositionRepositoryImpl } from './repositories/update-task-position.repository';
import { UpsertTaskPositionRepositoryImpl } from './repositories/upsert-task-position.repository';
import { CreateAtEndTaskPositionServiceImpl } from './services/create-at-end-task-position.service';
import { CreateAtTopTaskPositionServiceImpl } from './services/create-at-top-task-position.service';
import { InitializeTaskPositionsServiceImpl } from './services/initialize-task-positions.service';
import { NormalizeTaskPositionContextServiceImpl } from './services/normalize-task-position-context.service';
import { RemoveTaskPositionFromContextServiceImpl } from './services/remove-task-position-from-context.service';
import { ReorderWithinContextTaskPositionServiceImpl } from './services/reorder-within-context-task-position.service';
import { TaskPositionService } from './services/task_position.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskPosition])],
  controllers: [TaskPositionController],
  providers: [
    TaskPositionService,
    // Repository
    {
      provide: TASK_POSITION_TYPES.repositories.FindOneTaskPositionRepository,
      useClass: FindOneTaskPositionRepositoryImpl,
    },
    {
      provide: TASK_POSITION_TYPES.repositories.FindFirstTaskPositionRepository,
      useClass: FindFirstTaskPositionRepositoryImpl,
    },
    {
      provide: TASK_POSITION_TYPES.repositories.FindLastTaskPositionRepository,
      useClass: FindLastTaskPositionRepositoryImpl,
    },
    {
      provide: TASK_POSITION_TYPES.repositories.FindAllTaskPositionsRepository,
      useClass: FindAllTaskPositionsRepositoryImpl,
    },
    {
      provide: TASK_POSITION_TYPES.repositories.CreateTaskPositionRepository,
      useClass: CreateTaskPositionRepositoryImpl,
    },
    {
      provide: TASK_POSITION_TYPES.repositories.UpsertTaskPositionRepository,
      useClass: UpsertTaskPositionRepositoryImpl,
    },
    {
      provide: TASK_POSITION_TYPES.repositories.UpdateTaskPositionRepository,
      useClass: UpdateTaskPositionRepositoryImpl,
    },
    {
      provide: TASK_POSITION_TYPES.repositories.DeleteTaskPositionRepository,
      useClass: DeleteTaskPositionRepositoryImpl,
    },
    {
      provide:
        TASK_POSITION_TYPES.repositories.UpdateManyTaskPositionsRepository,
      useClass: UpdateManyTaskPositionsRepositoryImpl,
    },
    // Service
    {
      provide: TASK_POSITION_TYPES.services.CreateAtEndTaskPositionService,
      useClass: CreateAtEndTaskPositionServiceImpl,
    },
    {
      provide: TASK_POSITION_TYPES.services.CreateAtTopTaskPositionService,
      useClass: CreateAtTopTaskPositionServiceImpl,
    },
    {
      provide:
        TASK_POSITION_TYPES.services.ReorderWithinContextTaskPositionService,
      useClass: ReorderWithinContextTaskPositionServiceImpl,
    },
    {
      provide:
        TASK_POSITION_TYPES.services.RemoveTaskPositionFromContextService,
      useClass: RemoveTaskPositionFromContextServiceImpl,
    },
    {
      provide: TASK_POSITION_TYPES.services.InitializeTaskPositionsService,
      useClass: InitializeTaskPositionsServiceImpl,
    },
    {
      provide: TASK_POSITION_TYPES.services.NormalizeTaskPositionContextService,
      useClass: NormalizeTaskPositionContextServiceImpl,
    },
  ],
  exports: [
    TASK_POSITION_TYPES.services.CreateAtEndTaskPositionService,
    TASK_POSITION_TYPES.services.CreateAtTopTaskPositionService,
    TASK_POSITION_TYPES.services.ReorderWithinContextTaskPositionService,
    TASK_POSITION_TYPES.services.RemoveTaskPositionFromContextService,
    TASK_POSITION_TYPES.services.InitializeTaskPositionsService,
    TASK_POSITION_TYPES.services.NormalizeTaskPositionContextService,
  ],
})
export class TaskPositionModule {}
