import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsModule } from '../projects/projects.module';
import { CreateSprintApplicationImpl } from './applications/create-sprint.application';
import { FindSprintApplicationImpl } from './applications/find-sprint.application';
import { SprintsController } from './controller/sprints.controller';
import { Sprint } from './domain/entities/sprint.entity';
import { SPRINT_TYPES } from './interfaces/types';
import { CreateSprintRepositoryImpl } from './repositories/create-sprints.repository';
import { FindSprintRepositoryImpl } from './repositories/find-sprints.repository';
import { CreateSprintServiceImpl } from './services/create-sprints.service';
import { FindSprintServiceImpl } from './services/find-sprint-service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sprint]),
    forwardRef(() => ProjectsModule),
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
    // Service
    {
      provide: SPRINT_TYPES.services.CreateSprintService,
      useClass: CreateSprintServiceImpl,
    },
    {
      provide: SPRINT_TYPES.services.FindSprintService,
      useClass: FindSprintServiceImpl,
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
  ],
  exports: [SPRINT_TYPES.services.FindSprintService],
})
export class SprintsModule {}
