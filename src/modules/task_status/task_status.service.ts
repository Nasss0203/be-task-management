import { Injectable } from '@nestjs/common';
import { CreateTaskStatusDto } from './dto/create-task_status.dto';
import { UpdateTaskStatusDto } from './dto/update-task_status.dto';

@Injectable()
export class TaskStatusService {
  create(createTaskStatusDto: CreateTaskStatusDto) {
    return 'This action adds a new taskStatus';
  }

  findAll() {
    return `This action returns all taskStatus`;
  }

  findOne(id: number) {
    return `This action returns a #${id} taskStatus`;
  }

  update(id: number, updateTaskStatusDto: UpdateTaskStatusDto) {
    return `This action updates a #${id} taskStatus`;
  }

  remove(id: number) {
    return `This action removes a #${id} taskStatus`;
  }
}
