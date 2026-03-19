import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskPriority } from './domain/entities/task_priority.entity';
import { TASK_PRIORITY_TYPES } from './interfaces/types';
import { CreateTaskPriorityRepositoryImpl } from './repositories/create.task_priority.repository';
import { CreateTaskPriorityServiceImpl } from './services/create.task_priority.service';
import { TaskPriorityController } from './task_priority.controller';
import { TaskPriorityService } from './task_priority.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskPriority])],
  controllers: [TaskPriorityController],
  providers: [
    TaskPriorityService,
    {
      provide: TASK_PRIORITY_TYPES.repositories.CreateTaskPriorityRepository,
      useClass: CreateTaskPriorityRepositoryImpl,
    },
    {
      provide: TASK_PRIORITY_TYPES.services.CreateTaskPriorityService,
      useClass: CreateTaskPriorityServiceImpl,
    },
  ],
  exports: [TASK_PRIORITY_TYPES.services.CreateTaskPriorityService],
})
export class TaskPriorityModule {}
