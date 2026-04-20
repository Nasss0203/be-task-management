import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Task } from '../domain/entities/task.entity';
import { TaskModel } from '../domain/models/task.model';
import { UpdateTaskDto } from '../dto/update-task.dto';
import { UpdateTaskRepository } from '../interfaces/repositories/update-task.repository.interface';
import { TaskMapper } from '../mapper/tasks.mapper';

@Injectable()
export class UpdateTaskRepositoryImpl implements UpdateTaskRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repoTask: Repository<Task>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<Task> {
    return manager ? manager.getRepository(Task) : this.repoTask;
  }

  async updateTask(
    updateTaskDto: UpdateTaskDto,
    manager?: EntityManager,
  ): Promise<TaskModel> {
    const repo = this.getRepo(manager);

    const payload = Object.fromEntries(
      Object.entries(updateTaskDto).filter(([, value]) => value !== undefined),
    );

    const task = await repo.preload({
      ...payload,
    });

    if (!task) {
      throw new HttpException('Task not found', HttpStatus.NOT_FOUND);
    }

    const saved = await repo.save(task);
    return TaskMapper.toModel(saved);
  }
}
