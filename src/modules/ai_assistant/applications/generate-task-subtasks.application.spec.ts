import { Test } from '@nestjs/testing';
import { GenerateTaskSubtasksApplicationImpl } from './generate-task-subtasks.application';
import { AI_ASSISTANT_TYPES } from '../interfaces/types';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('GenerateTaskSubtasksApplicationImpl', () => {
  let application: GenerateTaskSubtasksApplicationImpl;

  const mockAiProviderService = {
    generateSubtasks: jest.fn(),
  };

  const mockFindTaskService = {
    findOneTask: jest.fn(),
  };

  const mockCreateTaskService = {
    create: jest.fn(),
  };

  const mockEntityManager = {};

  const mockDataSource = {
    transaction: jest.fn().mockImplementation((cb) => cb(mockEntityManager)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        GenerateTaskSubtasksApplicationImpl,
        {
          provide: AI_ASSISTANT_TYPES.services.AiProviderService,
          useValue: mockAiProviderService,
        },
        {
          provide: TASK_TYPES.services.FindTaskService,
          useValue: mockFindTaskService,
        },
        {
          provide: TASK_TYPES.services.CreateTaskService,
          useValue: mockCreateTaskService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    application = module.get<GenerateTaskSubtasksApplicationImpl>(
      GenerateTaskSubtasksApplicationImpl,
    );
  });

  it('throws NotFoundException if the parent task does not exist', async () => {
    mockFindTaskService.findOneTask.mockResolvedValue(null);

    await expect(
      application.generate({
        taskId: 'parent-1',
        userId: 'user-1',
      }),
    ).rejects.toThrow(NotFoundException);

    expect(mockFindTaskService.findOneTask).toHaveBeenCalledWith('parent-1');
    expect(mockAiProviderService.generateSubtasks).not.toHaveBeenCalled();
  });

  it('calls AI provider and creates subtasks if found', async () => {
    const parentTask = {
      id: 'parent-1',
      title: 'Design Database',
      description: 'Detail DB design',
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      statusId: 'status-todo',
      priorityId: 'priority-high',
      sprintId: 'sprint-1',
      subtasks: [],
    };

    mockFindTaskService.findOneTask.mockResolvedValue(parentTask);
    mockAiProviderService.generateSubtasks.mockResolvedValue([
      'Create ERD',
      'Write schemas',
    ]);
    mockCreateTaskService.create.mockImplementation((input) =>
      Promise.resolve({ id: `subtask-${input.title}` }),
    );

    const result = await application.generate({
      taskId: 'parent-1',
      userId: 'user-1',
    });

    expect(mockFindTaskService.findOneTask).toHaveBeenCalledWith('parent-1');
    expect(mockAiProviderService.generateSubtasks).toHaveBeenCalledWith(
      'Design Database',
      'Detail DB design',
      [],
    );
    expect(mockDataSource.transaction).toHaveBeenCalled();
    expect(mockCreateTaskService.create).toHaveBeenCalledTimes(2);

    expect(mockCreateTaskService.create).toHaveBeenNthCalledWith(
      1,
      {
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        parentTaskId: 'parent-1',
        title: 'Create ERD',
        description: null,
        statusId: 'status-todo',
        priorityId: 'priority-high',
        createdBy: 'user-1',
        sprintId: 'sprint-1',
      },
      mockEntityManager,
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'subtask-Create ERD' });
    expect(result[1]).toEqual({ id: 'subtask-Write schemas' });
  });

  it('passes existing subtask titles to AI provider and filters out duplicate output titles', async () => {
    const parentTask = {
      id: 'parent-1',
      title: 'Design Database',
      description: 'Detail DB design',
      workspaceId: 'workspace-1',
      projectId: 'project-1',
      statusId: 'status-todo',
      priorityId: 'priority-high',
      sprintId: 'sprint-1',
      subtasks: [{ title: 'Create ERD' }, { title: 'Write Schemas' }],
    };

    mockFindTaskService.findOneTask.mockResolvedValue(parentTask);
    mockAiProviderService.generateSubtasks.mockResolvedValue([
      'Create ERD', // Duplicate
      'write schemas', // Case-insensitive duplicate
      'Refine ERD', // New subtask
    ]);
    mockCreateTaskService.create.mockImplementation((input) =>
      Promise.resolve({ id: `subtask-${input.title}` }),
    );

    const result = await application.generate({
      taskId: 'parent-1',
      userId: 'user-1',
    });

    expect(mockFindTaskService.findOneTask).toHaveBeenCalledWith('parent-1');
    expect(mockAiProviderService.generateSubtasks).toHaveBeenCalledWith(
      'Design Database',
      'Detail DB design',
      ['create erd', 'write schemas'],
    );
    expect(mockCreateTaskService.create).toHaveBeenCalledTimes(1);

    expect(mockCreateTaskService.create).toHaveBeenCalledWith(
      {
        workspaceId: 'workspace-1',
        projectId: 'project-1',
        parentTaskId: 'parent-1',
        title: 'Refine ERD',
        description: null,
        statusId: 'status-todo',
        priorityId: 'priority-high',
        createdBy: 'user-1',
        sprintId: 'sprint-1',
      },
      mockEntityManager,
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 'subtask-Refine ERD' });
  });
});
