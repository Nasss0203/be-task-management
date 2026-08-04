import { Test, TestingModule } from '@nestjs/testing';
import { CreateProjectServiceImpl } from './create.projects.service';
import { PROJECT_TYPES } from '../interfaces/types';
import { PAGE_TYPES } from 'src/modules/page/interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { BOARD_TYPES } from 'src/modules/boards/interfaces/types';
import { PAGE_BLOCK_TYPES } from 'src/modules/page_block/interfaces/types';
import { TASK_STATUS_TYPES } from 'src/modules/task_status/interfaces/types';
import { TASK_PRIORITY_TYPES } from 'src/modules/task_priority/interfaces/types';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { BILLING_TYPES } from 'src/modules/billing/interfaces/types';
import { BoardViewType } from 'src/modules/boards/domain/entities/board.entity';
import { PageBlockType } from 'src/modules/page_block/domain/entities/page_block.entity';
import { HttpException } from '@nestjs/common';

describe('CreateProjectServiceImpl', () => {
  let service: CreateProjectServiceImpl;

  const mockRepo = {
    save: jest.fn(),
  };
  const mockFindProjectRepository = {};
  const mockFindPageService = {
    findPageByWorkspaceId: jest.fn(),
  };
  const mockUow = {
    runInTransaction: jest.fn((cb) => cb({})),
  };
  const mockCreateBoardService = {
    create: jest.fn(),
  };
  const mockCreatePageBlockService = {
    create: jest.fn(),
  };
  const mockFindPageBlockService = {
    getNextOrderIndex: jest.fn(),
  };
  const mockCreateTaskStatusService = {
    createMany: jest.fn(),
  };
  const mockCreateTaskPriorityService = {
    createMany: jest.fn(),
  };
  const mockCreateTaskService = {
    createMany: jest.fn(),
  };
  const mockUsageLimitEnforcerService = {
    checkProjectLimit: jest.fn(),
    syncProjectUsedValue: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateProjectServiceImpl,
        {
          provide: PROJECT_TYPES.repositories.CreateProjectRepository,
          useValue: mockRepo,
        },
        {
          provide: PROJECT_TYPES.repositories.FindProjectRepository,
          useValue: mockFindProjectRepository,
        },
        {
          provide: PAGE_TYPES.services.FindPageService,
          useValue: mockFindPageService,
        },
        { provide: WORKSPACE_TYPES.uow.UnitOfWork, useValue: mockUow },
        {
          provide: BOARD_TYPES.services.CreateBoardService,
          useValue: mockCreateBoardService,
        },
        {
          provide: PAGE_BLOCK_TYPES.services.CreatePageBlockService,
          useValue: mockCreatePageBlockService,
        },
        {
          provide: PAGE_BLOCK_TYPES.services.FindPageBlockService,
          useValue: mockFindPageBlockService,
        },
        {
          provide: TASK_STATUS_TYPES.services.CreateTaskStatusService,
          useValue: mockCreateTaskStatusService,
        },
        {
          provide: TASK_PRIORITY_TYPES.services.CreateTaskPriorityService,
          useValue: mockCreateTaskPriorityService,
        },
        {
          provide: TASK_TYPES.services.CreateTaskService,
          useValue: mockCreateTaskService,
        },
        {
          provide: BILLING_TYPES.services.UsageLimitEnforcerService,
          useValue: mockUsageLimitEnforcerService,
        },
      ],
    }).compile();

    service = module.get<CreateProjectServiceImpl>(CreateProjectServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should call save on repo', async () => {
      const dto = { name: 'Test' } as any;
      const manager = {} as any;
      mockRepo.save.mockResolvedValue({ id: '1' });

      const result = await service.create(dto, manager);

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test',
          created_by: 'sys',
          key: expect.any(String),
        }),
        manager,
      );
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('createProjectWithPageBlock', () => {
    const defaultDto = {
      workspace_id: 'ws-1',
      created_by: 'usr-1',
      name: 'Test Project',
      create_default_board: true,
      default_board_view_type: BoardViewType.BOARD,
    };

    const mockProject = { id: 'proj-1', name: 'Test Project' };
    const mockBoard = { id: 'board-1', viewType: BoardViewType.BOARD };
    const mockStatuses = [
      { id: 's1', name: 'Todo' },
      { id: 's2', name: 'In Progress' },
      { id: 's3', name: 'Done' },
    ];
    const mockPriorities = [
      { id: 'p1', name: 'Low' },
      { id: 'p2', name: 'Medium' },
      { id: 'p3', name: 'High' },
      { id: 'p4', name: 'Urgent' },
    ];

    beforeEach(() => {
      mockRepo.save.mockResolvedValue(mockProject);
      mockCreateBoardService.create.mockResolvedValue(mockBoard);
      mockCreateTaskStatusService.createMany.mockResolvedValue(mockStatuses);
      mockCreateTaskPriorityService.createMany.mockResolvedValue(
        mockPriorities,
      );
      mockCreateTaskService.createMany.mockResolvedValue([]);
      mockFindPageService.findPageByWorkspaceId.mockResolvedValue({
        id: 'page-1',
      });
      mockFindPageBlockService.getNextOrderIndex.mockResolvedValue(1);
    });

    it('should create project with all default resources if create_default_board is true', async () => {
      Date.now = jest.fn(() => 1234567890); // Mock Date.now for predictable key

      const result = await service.createProjectWithPageBlock(
        defaultDto as any,
      );

      expect(
        mockUsageLimitEnforcerService.checkProjectLimit,
      ).toHaveBeenCalledWith('ws-1', expect.anything());

      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Project',
          workspace_id: 'ws-1',
          created_by: 'usr-1',
          key: 'Test Project-usr--1234567890',
        }),
        expect.anything(),
      );

      expect(mockCreateBoardService.create).toHaveBeenCalled();
      expect(mockCreateTaskStatusService.createMany).toHaveBeenCalled();
      expect(mockCreateTaskPriorityService.createMany).toHaveBeenCalled();
      expect(mockCreateTaskService.createMany).not.toHaveBeenCalled();
      expect(mockCreatePageBlockService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          page_id: 'page-1',
          type: PageBlockType.DATABASE_VIEW,
          data_config: expect.objectContaining({
            project_id: 'proj-1',
            default_board_id: 'board-1',
          }),
        }),
        expect.anything(),
      );
      expect(
        mockUsageLimitEnforcerService.syncProjectUsedValue,
      ).toHaveBeenCalledWith('ws-1', expect.anything());

      expect(result).toEqual(mockProject);
    });

    it('should skip creating board and tasks if create_default_board is false', async () => {
      const dto = { ...defaultDto, create_default_board: false };

      await service.createProjectWithPageBlock(dto as any);

      expect(mockCreateBoardService.create).not.toHaveBeenCalled();
      expect(mockCreateTaskService.createMany).not.toHaveBeenCalled();
      // Statuses and priorities should still be created
      expect(mockCreateTaskStatusService.createMany).toHaveBeenCalled();
      expect(mockCreateTaskPriorityService.createMany).toHaveBeenCalled();
    });

    it('should skip creating page block if page is not found', async () => {
      mockFindPageService.findPageByWorkspaceId.mockResolvedValue(null);

      await service.createProjectWithPageBlock(defaultDto as any);

      expect(mockCreatePageBlockService.create).not.toHaveBeenCalled();
    });

    it('should use custom manager and bypass runInTransaction if provided', async () => {
      const customManager = { query: jest.fn() } as any;

      await service.createProjectWithPageBlock(
        defaultDto as any,
        customManager,
      );

      expect(mockUow.runInTransaction).not.toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.anything(),
        customManager,
      );
    });

    it('should use runInTransaction if custom manager is not provided', async () => {
      await service.createProjectWithPageBlock(defaultDto as any);

      expect(mockUow.runInTransaction).toHaveBeenCalled();
    });
  });
});
