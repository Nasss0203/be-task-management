import { Injectable } from '@nestjs/common';
import { CreateTaskPositionDto } from '../dto/create-task_position.dto';
import { UpdateTaskPositionDto } from '../dto/update-task_position.dto';

@Injectable()
export class TaskPositionService {
  create(createTaskPositionDto: CreateTaskPositionDto) {
    return 'This action adds a new taskPosition';
  }

  findAll() {
    return `This action returns all taskPosition`;
  }

  findOne(id: string) {
    return `This action returns a #${id} taskPosition`;
  }

  update(id: string, updateTaskPositionDto: UpdateTaskPositionDto) {
    return `This action updates a #${id} taskPosition`;
  }

  remove(id: string) {
    return `This action removes a #${id} taskPosition`;
  }
}
