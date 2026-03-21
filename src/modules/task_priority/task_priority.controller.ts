import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TaskPriorityService } from './task_priority.service';
import { CreateTaskPriorityDto } from './dto/create-task_priority.dto';
import { UpdateTaskPriorityDto } from './dto/update-task_priority.dto';

@Controller('task-priority')
export class TaskPriorityController {
  constructor(private readonly taskPriorityService: TaskPriorityService) {}

  @Post()
  create(@Body() createTaskPriorityDto: CreateTaskPriorityDto) {
    return this.taskPriorityService.create(createTaskPriorityDto);
  }

  @Get()
  findAll() {
    return this.taskPriorityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskPriorityService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskPriorityDto: UpdateTaskPriorityDto) {
    return this.taskPriorityService.update(+id, updateTaskPriorityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskPriorityService.remove(+id);
  }
}
