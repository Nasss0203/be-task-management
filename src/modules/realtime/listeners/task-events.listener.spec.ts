import { Test, TestingModule } from '@nestjs/testing';
import { TaskEventsListener } from './task-events.listener';
import {
  REALTIME_EVENTS,
  type TaskCreatedPayload,
  type TaskUpdatedPayload,
  type TaskDeletedPayload,
} from '../realtime.events';
import { RealtimeEmitterService } from '../services/realtime-emitter.service';

describe('TaskEventsListener', () => {
  let listener: TaskEventsListener;
  let realtimeEmitterService: jest.Mocked<RealtimeEmitterService>;

  beforeEach(async () => {
    const mockRealtimeEmitterService = {
      emitToProject: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskEventsListener,
        {
          provide: RealtimeEmitterService,
          useValue: mockRealtimeEmitterService,
        },
      ],
    }).compile();

    listener = module.get<TaskEventsListener>(TaskEventsListener);
    realtimeEmitterService = module.get(RealtimeEmitterService);
  });

  it('should be defined', () => {
    expect(listener).toBeDefined();
  });

  describe('handleCreated', () => {
    it('should emit TASK_CREATED event to project room', () => {
      const payload: TaskCreatedPayload = {
        projectId: 'project-1',
        taskId: 'task-1',
        task: { id: 'task-1', title: 'Test Task' } as any,
      };

      listener.handleCreated(payload);

      expect(realtimeEmitterService.emitToProject).toHaveBeenCalledWith(
        payload.projectId,
        REALTIME_EVENTS.TASK_CREATED,
        payload.task,
      );
    });
  });

  describe('handleUpdated', () => {
    it('should emit TASK_UPDATED event to project room', () => {
      const payload: TaskUpdatedPayload = {
        projectId: 'project-1',
        taskId: 'task-1',
        task: { id: 'task-1', title: 'Updated Task' } as any,
        previousState: {} as any,
      };

      listener.handleUpdated(payload);

      expect(realtimeEmitterService.emitToProject).toHaveBeenCalledWith(
        payload.projectId,
        REALTIME_EVENTS.TASK_UPDATED,
        payload.task,
      );
    });
  });

  describe('handleDeleted', () => {
    it('should emit TASK_DELETED event to project room', () => {
      const payload: TaskDeletedPayload = {
        projectId: 'project-1',
        taskId: 'task-1',
      };

      listener.handleDeleted(payload);

      expect(realtimeEmitterService.emitToProject).toHaveBeenCalledWith(
        payload.projectId,
        REALTIME_EVENTS.TASK_DELETED,
        { taskId: payload.taskId },
      );
    });
  });
});
