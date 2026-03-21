import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
  imports: [TypeOrmModule.forFeature([Project])],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    {
      provide: PROJECT_TYPES.applications.FindProjectApplication,
      useClass: FindProjectApplicationImpl,
    },
    {
      provide: PROJECT_TYPES.applications.CreateProjectApplication,
      useClass: CreateProjectApplicationImpl,
    },
    {
      provide: PROJECT_TYPES.repositories.CreateProjectRepository,
      useClass: CreateProjectRepositoryImpl,
    },
    {
      provide: PROJECT_TYPES.repositories.FindProjectRepository,
      useClass: FindProjectRepositoryImpl,
    },
    {
      provide: PROJECT_TYPES.services.CreateProjectService,
      useClass: CreateProjectServiceImpl,
    },
    {
      provide: PROJECT_TYPES.services.FindProjectService,
      useClass: FindProjectServiceImpl,
    },
  ],
  exports: [PROJECT_TYPES.services.CreateProjectService],
})
export class ProjectsModule {}
