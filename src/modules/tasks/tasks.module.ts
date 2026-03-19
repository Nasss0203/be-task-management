import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './controller/tasks.controller';
import { Task } from './domain/entities/task.entity';
import { TASK_TYPES } from './interfaces/types';
import { CreateTaskRepositoryImpl } from './repositories/create.tasks.repository';
import { CreateTaskServiceImpl } from './services/create.tasks.service';
import { TasksService } from './tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [TasksController],
  providers: [
    TasksService,
    {
      provide: TASK_TYPES.repositories.CreateTaskRepository,
      useClass: CreateTaskRepositoryImpl,
    },
    {
      provide: TASK_TYPES.services.CreateTaskService,
      useClass: CreateTaskServiceImpl,
    },
  ],
  exports: [TASK_TYPES.services.CreateTaskService],
})
export class TasksModule {}
