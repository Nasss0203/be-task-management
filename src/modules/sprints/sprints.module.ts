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
import { GetSprintDetailApplicationImpl } from './applications/get-sprint-detail.application';
import { StartSprintApplicationImpl } from './applications/start-sprint.application';
import { UpdateSprintApplicationImpl } from './applications/update-sprint.application';
import { SprintsController } from './controller/sprints.controller';
import { Sprint } from './domain/entities/sprint.entity';
import { SPRINT_TYPES } from './interfaces/types';
import { CancelSprintRepositoryImpl } from './repositories/cancel-sprint.repository';
import { CompleteSprintRepositoryImpl } from './repositories/complete-sprint.repository';
import { CreateSprintRepositoryImpl } from './repositories/create-sprints.repository';
import { FindSprintRepositoryImpl } from './repositories/find-sprints.repository';
import { StartSprintRepositoryImpl } from './repositories/start-sprint.repository';
import { UpdateSprintRepositoryImpl } from './repositories/udpdate-sprint.repository';
import { CancelSprintServiceImpl } from './services/cancel-sprint.service';
import { CompleteSprintServiceImpl } from './services/complete-sprint.service';
import { CreateSprintServiceImpl } from './services/create-sprints.service';
import { FindSprintServiceImpl } from './services/find-sprint-service';
<<<<<<< HEAD
import { GetSprintDetailServiceImpl } from './services/get-sprint-detail.service';
import { StartSprintServiceImpl } from './services/start-sprint.service';
import { UpdateSprintServiceImpl } from './services/udpdate-sprint.service';
=======
import { DeleteSprintApplicationImpl } from './applications/delete-sprint.application';
import { DeleteSprintServiceImpl } from './services/delete-sprint.service';
import { DeleteSprintRepositoryImpl } from './repositories/delete-sprint.repository';
>>>>>>> b7802d9 (feat(workspace): add soft delete and restore sprint)

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
<<<<<<< HEAD
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
    {
      provide: SPRINT_TYPES.applications.UpdateSprintApplication,
      useClass: UpdateSprintApplicationImpl,
    },
    {
      provide: SPRINT_TYPES.applications.GetSprintDetailApplication,
      useClass: GetSprintDetailApplicationImpl,
=======
      provide: SPRINT_TYPES.applications.DeleteSprintApplication,
      useClass: DeleteSprintApplicationImpl,
>>>>>>> b7802d9 (feat(workspace): add soft delete and restore sprint)
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
<<<<<<< HEAD
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
    {
      provide: SPRINT_TYPES.services.UpdateSprintService,
      useClass: UpdateSprintServiceImpl,
    },
    {
      provide: SPRINT_TYPES.services.GetSprintDetailService,
      useClass: GetSprintDetailServiceImpl,
=======
      provide: SPRINT_TYPES.services.DeleteSprintService,
      useClass: DeleteSprintServiceImpl,
>>>>>>> b7802d9 (feat(workspace): add soft delete and restore sprint)
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
<<<<<<< HEAD
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
    {
      provide: SPRINT_TYPES.repositories.UpdateSprintRepository,
      useClass: UpdateSprintRepositoryImpl,
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
=======
      provide: SPRINT_TYPES.repositories.DeleteSprintRepository,
      useClass: DeleteSprintRepositoryImpl,
    },
>>>>>>> b7802d9 (feat(workspace): add soft delete and restore sprint)
  ],
})
export class SprintsModule {}
