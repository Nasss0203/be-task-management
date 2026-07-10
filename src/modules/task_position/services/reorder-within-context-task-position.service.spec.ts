import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import Decimal from 'decimal.js';
import { ReorderWithinContextTaskPositionServiceImpl } from './reorder-within-context-task-position.service';
import { TASK_POSITION_TYPES } from '../interfaces/types';
import { POSITION_STEP, POSITION_SCALE } from '../utils/task-position.util';

describe('ReorderWithinContextTaskPositionServiceImpl', () => {
  let service: ReorderWithinContextTaskPositionServiceImpl;
  let mockFindOneRepository: any;
  let mockFindLastRepository: any;
  let mockUpsertRepository: any;
  let mockNormalizeService: any;

  beforeEach(async () => {
    mockFindOneRepository = {
      findOneByTaskAndContext: jest.fn(),
    };
    mockFindLastRepository = {
      findLastInContext: jest.fn(),
    };
    mockUpsertRepository = {
      upsert: jest.fn(),
    };
    mockNormalizeService = {
      normalizeContext: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReorderWithinContextTaskPositionServiceImpl,
        {
          provide: TASK_POSITION_TYPES.repositories.FindOneTaskPositionRepository,
          useValue: mockFindOneRepository,
        },
        {
          provide: TASK_POSITION_TYPES.repositories.FindLastTaskPositionRepository,
          useValue: mockFindLastRepository,
        },
        {
          provide: TASK_POSITION_TYPES.repositories.UpsertTaskPositionRepository,
          useValue: mockUpsertRepository,
        },
        {
          provide: TASK_POSITION_TYPES.services.NormalizeTaskPositionContextService,
          useValue: mockNormalizeService,
        },
      ],
    }).compile();

    service = module.get<ReorderWithinContextTaskPositionServiceImpl>(
      ReorderWithinContextTaskPositionServiceImpl,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('reorderWithinContext', () => {
    const inputBase = {
      taskId: 'task-id-1',
      context: 'kanban' as const,
      contextId: 'context-id-1',
    };

    it('should throw BadRequestException if task is its own neighbor', async () => {
      await expect(
        service.reorderWithinContext({
          ...inputBase,
          previousTaskId: 'task-id-1',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.reorderWithinContext({
          ...inputBase,
          nextTaskId: 'task-id-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if previous and next tasks are the same', async () => {
      await expect(
        service.reorderWithinContext({
          ...inputBase,
          previousTaskId: 'task-id-2',
          nextTaskId: 'task-id-2',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate correct position when both previous and next exist', async () => {
      const prevTaskPos = { taskId: 'prev-1', position: '1000.000000000000000' };
      const nextTaskPos = { taskId: 'next-1', position: '2000.000000000000000' };

      mockFindOneRepository.findOneByTaskAndContext
        .mockResolvedValueOnce(prevTaskPos)
        .mockResolvedValueOnce(nextTaskPos);

      mockUpsertRepository.upsert.mockResolvedValue({
        taskId: 'task-id-1',
        position: '1500.000000000000000',
      });

      const result = await service.reorderWithinContext({
        ...inputBase,
        previousTaskId: 'prev-1',
        nextTaskId: 'next-1',
      });

      expect(mockUpsertRepository.upsert).toHaveBeenCalledWith(
        {
          taskId: 'task-id-1',
          context: 'kanban',
          contextId: 'context-id-1',
          position: '1500.000000000000000',
        },
        undefined,
      );
      expect(result.position).toBe('1500.000000000000000');
    });

    it('should dynamically create previous task position when missing', async () => {
      // previous is missing, next exists
      mockFindOneRepository.findOneByTaskAndContext
        .mockResolvedValueOnce(null) // previous
        .mockResolvedValueOnce({ taskId: 'next-1', position: '3000.000000000000000' }); // next

      // Mock finding the last task position in context to be 1000
      mockFindLastRepository.findLastInContext.mockResolvedValue({
        taskId: 'other-task',
        position: '1000.000000000000000',
      });

      // Mocking upsert return value for previous task (gets last + STEP = 2000)
      const prevUpsertedPos = '2000.000000000000000';
      mockUpsertRepository.upsert
        .mockResolvedValueOnce({
          taskId: 'prev-1',
          position: prevUpsertedPos,
        })
        .mockResolvedValueOnce({
          taskId: 'task-id-1',
          position: '2500.000000000000000', // between 2000 and 3000
        });

      const result = await service.reorderWithinContext({
        ...inputBase,
        previousTaskId: 'prev-1',
        nextTaskId: 'next-1',
      });

      expect(mockFindLastRepository.findLastInContext).toHaveBeenCalledWith(
        { context: 'kanban', contextId: 'context-id-1' },
        undefined,
      );
      expect(mockUpsertRepository.upsert).toHaveBeenNthCalledWith(
        1,
        {
          taskId: 'prev-1',
          context: 'kanban',
          contextId: 'context-id-1',
          position: prevUpsertedPos,
        },
        undefined,
      );
      expect(result.position).toBe('2500.000000000000000');
    });

    it('should dynamically create next task position when missing', async () => {
      // previous exists, next is missing
      mockFindOneRepository.findOneByTaskAndContext
        .mockResolvedValueOnce({ taskId: 'prev-1', position: '1000.000000000000000' }) // previous
        .mockResolvedValueOnce(null); // next

      // Mock finding the last task position in context to be 1000 (after previous is processed)
      mockFindLastRepository.findLastInContext.mockResolvedValue({
        taskId: 'prev-1',
        position: '1000.000000000000000',
      });

      // Mocking upsert return value for next task (gets last + STEP = 2000)
      const nextUpsertedPos = '2000.000000000000000';
      mockUpsertRepository.upsert
        .mockResolvedValueOnce({
          taskId: 'next-1',
          position: nextUpsertedPos,
        })
        .mockResolvedValueOnce({
          taskId: 'task-id-1',
          position: '1500.000000000000000', // between 1000 and 2000
        });

      const result = await service.reorderWithinContext({
        ...inputBase,
        previousTaskId: 'prev-1',
        nextTaskId: 'next-1',
      });

      expect(mockUpsertRepository.upsert).toHaveBeenNthCalledWith(
        1,
        {
          taskId: 'next-1',
          context: 'kanban',
          contextId: 'context-id-1',
          position: nextUpsertedPos,
        },
        undefined,
      );
      expect(result.position).toBe('1500.000000000000000');
    });

    it('should throw BadRequestException if previous task position is greater than or equal to next task position', async () => {
      mockFindOneRepository.findOneByTaskAndContext
        .mockResolvedValueOnce({ taskId: 'prev-1', position: '2000.000000000000000' })
        .mockResolvedValueOnce({ taskId: 'next-1', position: '1000.000000000000000' });

      await expect(
        service.reorderWithinContext({
          ...inputBase,
          previousTaskId: 'prev-1',
          nextTaskId: 'next-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
