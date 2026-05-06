import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { ProjectsModule } from '../projects/projects.module';
import { TaskStatusModule } from '../task_status/task_status.module';
import { TasksModule } from '../tasks/tasks.module';
import { CancelSprintApplicationImpl } from './applications/cancel-sprint.application';
import { CompleteSprintApplicationImpl } from './applications/complete-sprint.application';
import { CreateSprintApplicationImpl } from './applications/create-sprint.application';
import { FindSprintApplicationImpl } from './applications/find-sprint.application';
import { StartSprintApplicationImpl } from './applications/start-sprint.application';
import { SprintsController } from './controller/sprints.controller';
import { Sprint } from './domain/entities/sprint.entity';
import { SPRINT_TYPES } from './interfaces/types';
import { CancelSprintRepositoryImpl } from './repositories/cancel-sprint.repository';
import { CompleteSprintRepositoryImpl } from './repositories/complete-sprint.repository';
import { CreateSprintRepositoryImpl } from './repositories/create-sprints.repository';
import { FindSprintRepositoryImpl } from './repositories/find-sprints.repository';
import { StartSprintRepositoryImpl } from './repositories/start-sprint.repository';
import { CancelSprintServiceImpl } from './services/cancel-sprint.service';
import { CompleteSprintServiceImpl } from './services/complete-sprint.service';
import { CreateSprintServiceImpl } from './services/create-sprints.service';
import { FindSprintServiceImpl } from './services/find-sprint-service';
import { StartSprintServiceImpl } from './services/start-sprint.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sprint]),
    forwardRef(() => ProjectsModule), // Đang dùng service
    forwardRef(() => TasksModule), // Đang dùng service
    TaskStatusModule,
  ],
  controllers: [SprintsController],
  providers: [
    // Application
    {
      provide: SPRINT_TYPES.applications.CreateSprintApplication,
      useClass: CreateSprintApplicationImpl,
    },
    {
      provide: SPRINT_TYPES.applications.FindSprintApplication,
      useClass: FindSprintApplicationImpl,
    },
    {
      provide: SPRINT_TYPES.applications.StartSprintApplication,
      useClass: StartSprintApplicationImpl,
    },
    {
      provide: SPRINT_TYPES.applications.CompleteSprintApplication,
      useClass: CompleteSprintApplicationImpl,
    },
    {
      provide: SPRINT_TYPES.applications.CancelSprintApplication,
      useClass: CancelSprintApplicationImpl,
    },
    // Service
    {
      provide: SPRINT_TYPES.services.CreateSprintService,
      useClass: CreateSprintServiceImpl,
    },
    {
      provide: SPRINT_TYPES.services.FindSprintService,
      useClass: FindSprintServiceImpl,
    },
    {
      provide: SPRINT_TYPES.services.StartSprintService,
      useClass: StartSprintServiceImpl,
    },
    {
      provide: SPRINT_TYPES.services.CompleteSprintService,
      useClass: CompleteSprintServiceImpl,
    },
    {
      provide: SPRINT_TYPES.services.CancelSprintService,
      useClass: CancelSprintServiceImpl,
    },
    // Repository
    {
      provide: SPRINT_TYPES.repositories.CreateSprintRepository,
      useClass: CreateSprintRepositoryImpl,
    },
    {
      provide: SPRINT_TYPES.repositories.FindSprintRepository,
      useClass: FindSprintRepositoryImpl,
    },
    {
      provide: SPRINT_TYPES.repositories.StartSprintRepository,
      useClass: StartSprintRepositoryImpl,
    },
    {
      provide: SPRINT_TYPES.repositories.CompleteSprintRepository,
      useClass: CompleteSprintRepositoryImpl,
    },
    {
      provide: SPRINT_TYPES.repositories.CancelSprintRepository,
      useClass: CancelSprintRepositoryImpl,
    },
    // Transaction
    {
      provide: SPRINT_TYPES.uow.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
  ],
  exports: [
    SPRINT_TYPES.services.FindSprintService,
    SPRINT_TYPES.repositories.FindSprintRepository,
  ],
})
export class SprintsModule {}
