import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmUnitOfWork } from 'src/common/helper/unit-work.typeorm';
import { BoardsModule } from '../boards/boards.module';
import { PageModule } from '../page/page.module';
import { PageBlockModule } from '../page_block/page_block.module';
import { TaskPriorityModule } from '../task_priority/task_priority.module';
import { TaskStatusModule } from '../task_status/task_status.module';
import { TasksModule } from '../tasks/tasks.module';
import { WORKSPACE_TYPES } from '../workspaces/interfaces/types';
import { CreateProjectApplicationImpl } from './applications/create-project.application';
import { FindProjectApplicationImpl } from './applications/find.project.application';
import { ProjectsController } from './controller/projects.controller';
import { Project } from './domain/entities/project.entity';
import { PROJECT_TYPES } from './interfaces/types';
import { ProjectsService } from './projects.service';
import { CreateProjectRepositoryImpl } from './repositories/create.projects.repository';
import { FindProjectRepositoryImpl } from './repositories/find.project.repository';
import { CreateProjectServiceImpl } from './services/create.projects.service';
import { FindProjectServiceImpl } from './services/find.project.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project]),
    PageModule,
    BoardsModule,
    PageBlockModule,
    TasksModule,
    TaskPriorityModule,
    TaskStatusModule,
  ],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    //Application
    {
      provide: PROJECT_TYPES.applications.FindProjectApplication,
      useClass: FindProjectApplicationImpl,
    },
    {
      provide: PROJECT_TYPES.applications.CreateProjectApplication,
      useClass: CreateProjectApplicationImpl,
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
  ],
  exports: [
    PROJECT_TYPES.services.CreateProjectService,
    PROJECT_TYPES.services.FindProjectService,
  ],
})
export class ProjectsModule {}
