import { Test, TestingModule } from '@nestjs/testing';
import { TasksController } from './tasks.controller';
import { TASK_TYPES } from '../interfaces/types';
import { FindTaskApplication } from '../interfaces/applications/find-task.application.interface';
import { CreateSubtaskApplication } from '../interfaces/applications/create-subtask.application.interface';
import { CreateTaskApplication } from '../interfaces/applications/create-task.application.interface';
import { UpdateTaskApplication } from '../interfaces/applications/update-task.application.interface';
import { MoveTaskSprintApplication } from '../interfaces/applications/move-task-sprint.application.interface';
import { DeleteTaskApplication } from '../interfaces/applications/delete-task.application.interface';
import { RemoveTaskFromSprintApplication } from '../interfaces/applications/remove-task-sprint.application.interface';
import { MoveTaskSprintToSprintApplication } from '../interfaces/applications/move-task-sprint-to-sprint.application.interface';
import { BadRequestException } from '@nestjs/common';

describe('TasksController', () => {
  let controller: TasksController;

  const mockFindTaskApplication = {
    findAllTask: jest.fn(),
    findBacklogTasks: jest.fn(),
    findOneTask: jest.fn(),
    findDeletedTasks: jest.fn(),
  };

  const mockCreateTaskApplication = {
    create: jest.fn(),
  };

  const mockCreateSubtaskApplication = {
    create: jest.fn(),
  };

  const mockUpdateTaskApplication = {
    updateTask: jest.fn(),
    updateManyTasks: jest.fn(),
  };

  const mockMoveTaskSprintApplication = {
    move: jest.fn(),
  };

  const mockDeleteTaskApplication = {
    delete: jest.fn(),
    restore: jest.fn(),
  };

  const mockRemoveTaskFromSprintApplication = {
    remove: jest.fn(),
  };

  const mockMoveTaskSprintToSprintApplication = {
    move: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TASK_TYPES.applications.FindTaskApplication,
          useValue: mockFindTaskApplication,
        },
        {
          provide: TASK_TYPES.applications.CreateTaskApplication,
          useValue: mockCreateTaskApplication,
        },
        {
          provide: TASK_TYPES.applications.CreateSubtaskApplication,
          useValue: mockCreateSubtaskApplication,
        },
        {
          provide: TASK_TYPES.applications.UpdateTaskApplication,
          useValue: mockUpdateTaskApplication,
        },
        {
          provide: TASK_TYPES.applications.MoveTaskSprintApplication,
          useValue: mockMoveTaskSprintApplication,
        },
        {
          provide: TASK_TYPES.applications.DeleteTaskApplication,
          useValue: mockDeleteTaskApplication,
        },
        {
          provide: TASK_TYPES.applications.RemoveTaskFromSprintApplication,
          useValue: mockRemoveTaskFromSprintApplication,
        },
        {
          provide: TASK_TYPES.applications.MoveTaskSprintToSprintApplication,
          useValue: mockMoveTaskSprintToSprintApplication,
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllByTask', () => {
    it('should return tasks', async () => {
      mockFindTaskApplication.findAllTask.mockResolvedValue([]);
      const result = await controller.findAllByTask(
        'proj-1',
        'ws-1',
        {} as any,
      );
      expect(result).toEqual([]);
      expect(mockFindTaskApplication.findAllTask).toHaveBeenCalledWith(
        'proj-1',
        'ws-1',
        {},
      );
    });
  });

  describe('findAllBacklogTask', () => {
    it('should return paginated backlog tasks', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };
      mockFindTaskApplication.findBacklogTasks.mockResolvedValue(mockResult);
      const result = await controller.findAllBacklogTask(
        'proj-1',
        'ws-1',
        {} as any,
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('create', () => {
    it('should create task', async () => {
      const dto = {} as any;
      const auth = { id: 'user-1' } as any;
      mockCreateTaskApplication.create.mockResolvedValue({
        id: 'task-1',
      } as any);

      const result = await controller.create(dto, auth);
      expect(result).toEqual({ id: 'task-1' });
      expect(mockCreateTaskApplication.create).toHaveBeenCalledWith({
        ...dto,
        createdBy: 'user-1',
      });
    });
  });

  describe('createSubtask', () => {
    it('should create subtask', async () => {
      const dto = { title: 'Subtask', statusId: 'status-1' } as any;
      const auth = { id: 'user-1' } as any;
      mockCreateSubtaskApplication.create.mockResolvedValue({
        id: 'subtask-1',
      } as any);

      const result = await controller.createSubtask('task-1', dto, auth);

      expect(result).toEqual({ id: 'subtask-1' });
      expect(mockCreateSubtaskApplication.create).toHaveBeenCalledWith({
        ...dto,
        parentTaskId: 'task-1',
        createdBy: 'user-1',
      });
    });
  });

  describe('findOneTask', () => {
    it('should find task detail', async () => {
      mockFindTaskApplication.findOneTask.mockResolvedValue({
        id: 'task-1',
      } as any);

      const result = await controller.findOneTask('task-1');

      expect(result).toEqual({ id: 'task-1' });
      expect(mockFindTaskApplication.findOneTask).toHaveBeenCalledWith(
        'task-1',
      );
    });
  });

  describe('updateTask', () => {
    it('should update task', async () => {
      const dto = {} as any;
      const auth = { id: 'user-1' } as any;
      mockUpdateTaskApplication.updateTask.mockResolvedValue({
        id: 'task-1',
      } as any);

      const result = await controller.updateTask('task-1', dto, auth);
      expect(result).toEqual({ id: 'task-1' });
      expect(mockUpdateTaskApplication.updateTask).toHaveBeenCalledWith({
        ...dto,
        id: 'task-1',
        actorId: 'user-1',
      });
    });
  });

  describe('moveTaskToSprint', () => {
    it('should move task to sprint', async () => {
      const dto = { sprintId: 'sprint-1' } as any;
      const auth = { id: 'user-1' } as any;
      mockMoveTaskSprintApplication.move.mockResolvedValue({
        id: 'task-1',
      } as any);

      const result = await controller.moveTaskToSprint('task-1', dto, auth);
      expect(result).toEqual({ id: 'task-1' });
      expect(mockMoveTaskSprintApplication.move).toHaveBeenCalledWith({
        taskId: 'task-1',
        sprintId: 'sprint-1',
        userId: 'user-1',
      });
    });
  });

  describe('deleteTask', () => {
    it('should delete task', async () => {
      const auth = { id: 'user-1' } as any;
      mockDeleteTaskApplication.delete.mockResolvedValue(undefined);

      const result = await controller.deleteTask('task-1', 'ws-1', auth);
      expect(result).toEqual({ success: true });
      expect(mockDeleteTaskApplication.delete).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        taskId: 'task-1',
        userId: 'user-1',
      });
    });
  });

  describe('restoreTask', () => {
    it('should restore task', async () => {
      const auth = { id: 'user-1' } as any;
      mockDeleteTaskApplication.restore.mockResolvedValue(undefined);

      const result = await controller.restoreTask('task-1', 'ws-1', auth);
      expect(result).toEqual({ success: true });
      expect(mockDeleteTaskApplication.restore).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        taskId: 'task-1',
        userId: 'user-1',
      });
    });
  });

  describe('findDeletedTasks', () => {
    it('should throw BadRequestException if workspaceId is not provided', async () => {
      await expect(controller.findDeletedTasks('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should find deleted tasks', async () => {
      mockFindTaskApplication.findDeletedTasks.mockResolvedValue([]);
      const result = await controller.findDeletedTasks('ws-1', 'proj-1');
      expect(result).toEqual([]);
      expect(mockFindTaskApplication.findDeletedTasks).toHaveBeenCalledWith(
        'ws-1',
        'proj-1',
      );
    });
  });

  describe('removeTaskFromSprint', () => {
    it('should remove task from sprint', async () => {
      const auth = { id: 'user-1' } as any;
      mockRemoveTaskFromSprintApplication.remove.mockResolvedValue({
        id: 'task-1',
      } as any);

      const result = await controller.removeTaskFromSprint('task-1', auth);
      expect(result).toEqual({ id: 'task-1' });
      expect(mockRemoveTaskFromSprintApplication.remove).toHaveBeenCalledWith({
        taskId: 'task-1',
        userId: 'user-1',
      });
    });
  });

  describe('moveTaskSprintToSprint', () => {
    it('should move task from one sprint to another', async () => {
      const dto = { targetSprintId: 'target-sprint' } as any;
      const auth = { id: 'user-1' } as any;
      mockMoveTaskSprintToSprintApplication.move.mockResolvedValue({
        id: 'task-1',
      } as any);

      const result = await controller.moveTaskSprintToSprint(
        'ws-1',
        'proj-1',
        'source-sprint',
        'task-1',
        dto,
        auth,
      );
      expect(result).toEqual({ id: 'task-1' });
      expect(mockMoveTaskSprintToSprintApplication.move).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        sourceSprintId: 'source-sprint',
        taskId: 'task-1',
        targetSprintId: 'target-sprint',
        userId: 'user-1',
      });
    });
  });

  describe('updateManyTasks', () => {
    it('should update many tasks', async () => {
      const dto = {} as any;
      const auth = { id: 'user-1' } as any;
      mockUpdateTaskApplication.updateManyTasks.mockResolvedValue([]);

      const result = await controller.updateManyTasks(
        'ws-1',
        'proj-1',
        dto,
        auth,
      );
      expect(result).toEqual([]);
      expect(mockUpdateTaskApplication.updateManyTasks).toHaveBeenCalledWith({
        workspaceId: 'ws-1',
        projectId: 'proj-1',
        actorId: 'user-1',
        dto,
      });
    });
  });
});
