import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskStatusController } from './controller/task_status.controller';
import { TaskStatus } from './domain/entities/task_status.entity';
import { TASK_STATUS_TYPES } from './interfaces/types';
import { CreateTaskStatusRepositoryImpl } from './repositories/create.task_status.repository';
import { CreateTaskStatusServiceImpl } from './services/create.task_status.service';
import { TaskStatusService } from './task_status.service';

@Module({
  imports: [TypeOrmModule.forFeature([TaskStatus])],
  controllers: [TaskStatusController],
  providers: [
    TaskStatusService,
    {
      provide: TASK_STATUS_TYPES.repositories.CreateTaskStatusRepository,
      useClass: CreateTaskStatusRepositoryImpl,
    },
    {
      provide: TASK_STATUS_TYPES.services.CreateTaskStatusService,
      useClass: CreateTaskStatusServiceImpl,
    },
  ],
  exports: [TASK_STATUS_TYPES.services.CreateTaskStatusService],
})
export class TaskStatusModule {}
