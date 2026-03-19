import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './domain/entities/project.entity';
import { PROJECT_TYPES } from './interfaces/types';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { CreateProjectRepositoryImpl } from './repositories/create.projects.repository';
import { CreateProjectServiceImpl } from './services/create.projects.service';

@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    {
      provide: PROJECT_TYPES.repositories.CreateProjectRepository,
      useClass: CreateProjectRepositoryImpl,
    },
    {
      provide: PROJECT_TYPES.services.CreateProjectService,
      useClass: CreateProjectServiceImpl,
    },
  ],
  exports: [PROJECT_TYPES.services.CreateProjectService],
})
export class ProjectsModule {}
