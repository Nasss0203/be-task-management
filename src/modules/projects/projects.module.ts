import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { BillingModule } from '../billing/billing.module';
import { ActivityModule } from '../activity/activity.module';
import { BoardsModule } from '../boards/boards.module';
import { PageModule } from '../page/page.module';
import { PageBlockModule } from '../page_block/page_block.module';
import { TaskPriorityModule } from '../task_priority/task_priority.module';
import { TaskStatusModule } from '../task_status/task_status.module';
import { TasksModule } from '../tasks/tasks.module';
import { WORKSPACE_TYPES } from '../workspaces/interfaces/types';
import { CreateProjectApplicationImpl } from './applications/create-project.application';
import { DeleteProjectApplicationImpl } from './applications/delete.project.application';
import { FindProjectApplicationImpl } from './applications/find.project.application';
import { UpdateProjectApplicationImpl } from './applications/update.project.application';
import { ProjectsController } from './controller/projects.controller';
import { Project } from './domain/entities/project.entity';
import { PROJECT_TYPES } from './interfaces/types';
import { CreateProjectRepositoryImpl } from './repositories/create.projects.repository';
import { DeleteProjectRepositoryImpl } from './repositories/delete.project.repository';
import { FindProjectRepositoryImpl } from './repositories/find.project.repository';
import { UpdateProjectRepositoryImpl } from './repositories/update.project.repository';
import { CreateProjectServiceImpl } from './services/create.projects.service';
import { DeleteProjectServiceImpl } from './services/delete.project.service';
import { FindProjectServiceImpl } from './services/find.project.service';
import { UpdateProjectServiceImpl } from './services/update.project.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    PageModule,
    BoardsModule,
    PageBlockModule,
    TasksModule,
    TaskPriorityModule,
    TaskStatusModule,
    BillingModule,
    ActivityModule,
  ],
  controllers: [ProjectsController],
  providers: [
    //Application
    {
      provide: PROJECT_TYPES.applications.FindProjectApplication,
      useClass: FindProjectApplicationImpl,
    },
    {
      provide: PROJECT_TYPES.applications.CreateProjectApplication,
      useClass: CreateProjectApplicationImpl,
    },
    {
      provide: PROJECT_TYPES.applications.DeleteProjectApplication,
      useClass: DeleteProjectApplicationImpl,
    },
    // Repository
    {
      provide: PROJECT_TYPES.repositories.CreateProjectRepository,
      useClass: CreateProjectRepositoryImpl,
    },
    {
      provide: PROJECT_TYPES.repositories.FindProjectRepository,
      useClass: FindProjectRepositoryImpl,
    },
    {
      provide: PROJECT_TYPES.repositories.DeleteProjectRepository,
      useClass: DeleteProjectRepositoryImpl,
    },

    // Service
    {
      provide: PROJECT_TYPES.services.CreateProjectService,
      useClass: CreateProjectServiceImpl,
    },
    {
      provide: PROJECT_TYPES.services.FindProjectService,
      useClass: FindProjectServiceImpl,
    },
    {
      provide: WORKSPACE_TYPES.uow.UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },
    {
      provide: PROJECT_TYPES.services.DeleteProjectService,
      useClass: DeleteProjectServiceImpl,
    },
    {
      provide: PROJECT_TYPES.repositories.UpdateProjectRepository,
      useClass: UpdateProjectRepositoryImpl,
    },
    {
      provide: PROJECT_TYPES.services.UpdateProjectService,
      useClass: UpdateProjectServiceImpl,
    },
    {
      provide: PROJECT_TYPES.applications.UpdateProjectApplication,
      useClass: UpdateProjectApplicationImpl,
    },
  ],
  exports: [
    PROJECT_TYPES.services.CreateProjectService,
    PROJECT_TYPES.repositories.CreateProjectRepository,
    PROJECT_TYPES.services.FindProjectService,
    PROJECT_TYPES.repositories.FindProjectRepository,
  ],
})
export class ProjectsModule {}
