import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ApplyAiGenerationApplicationImpl } from './apply-ai-generation.application';
import { AI_ASSISTANT_TYPES } from '../interfaces/types';
import { WORKSPACE_TYPES } from 'src/modules/workspaces/interfaces/types';
import { PROJECT_TYPES } from 'src/modules/projects/interfaces/types';
import { TASK_TYPES } from 'src/modules/tasks/interfaces/types';
import { AiGenerationStatus } from '../domain/enums/ai-generation-status.enum';
import { AiGenerationType } from '../domain/enums/ai-generation-type.enum';
import { AiProvider } from '../domain/enums/ai-provider.enum';
import { AiAppliedEntityType } from '../domain/enums/ai-applied-entity-type.enum';
import { AiGenerationModel } from '../domain/models/ai-generation.model';

const GENERATION_ID = 'gen-uuid-1';
const USER_ID = 'user-uuid-1';
const CONVERSATION_ID = 'conv-uuid-1';

const stubGeneratedModel = new AiGenerationModel(
  GENERATION_ID,
  USER_ID,
  CONVERSATION_ID,
  null,
  null,
  null,
  null,
  null,
  AiGenerationType.TASK_DRAFT,
  'message',
  null,
  {
    tasks: [
      {
        title: 'Task Title',
        description: 'Desc',
        priority: 'HIGH',
        estimatedHours: 2,
        subtasks: [],
        acceptanceCriteria: [],
        risks: [],
      },
    ],
  },
  AiProvider.GEMINI,
  'gemini-2.5-flash',
  AiGenerationStatus.GENERATED,
  null,
  null,
  null,
  null,
  null,
  null,
  new Date(),
  new Date(),
);

const stubAppliedModel = new AiGenerationModel(
  GENERATION_ID,
  USER_ID,
  CONVERSATION_ID,
  null,
  null,
  null,
  null,
  null,
  AiGenerationType.TASK_DRAFT,
  'message',
  null,
  {
    tasks: [
      {
        title: 'Task Title',
        description: 'Desc',
        priority: 'HIGH',
        estimatedHours: 2,
        subtasks: [],
        acceptanceCriteria: [],
        risks: [],
      },
    ],
  },
  AiProvider.GEMINI,
  'gemini-2.5-flash',
  AiGenerationStatus.APPLIED,
  [
    {
      entityType: AiAppliedEntityType.TASK,
      entityId: 'created-task-id',
      action: 'CREATE',
    },
  ],
  null,
  null,
  null,
  null,
  null,
  new Date(),
  new Date(),
);


const mockGenerationService = {
  findByIdForUser: jest.fn(),
  updateAppliedResults: jest.fn(),
  updateStatus: jest.fn(),
};


const mockCreateWorkspaceTemplateService = {
  create: jest.fn(),
};

const mockCreateProjectService = {
  createProjectWithPageBlock: jest.fn(),
};

const mockCreateTaskService = {
  create: jest.fn(),
};

const mockEntityManager = {
  query: jest.fn(),
};

const mockDataSource = {
  query: jest.fn(),
  transaction: jest.fn().mockImplementation((cb) => cb(mockEntityManager)),
};


describe('ApplyAiGenerationApplicationImpl', () => {
  let application: ApplyAiGenerationApplicationImpl;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplyAiGenerationApplicationImpl,
        {
          provide: AI_ASSISTANT_TYPES.services.AiGenerationService,
          useValue: mockGenerationService,
        },
        {
          provide: WORKSPACE_TYPES.services.CreateWorkspaceTemplateService,
          useValue: mockCreateWorkspaceTemplateService,
        },
        {
          provide: PROJECT_TYPES.services.CreateProjectService,
          useValue: mockCreateProjectService,
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

    application = module.get<ApplyAiGenerationApplicationImpl>(
      ApplyAiGenerationApplicationImpl,
    );
  });

  describe('apply', () => {
    it('successfully updates status to APPLIED when appliedResults is provided', async () => {
      mockGenerationService.findByIdForUser.mockResolvedValue(
        stubGeneratedModel,
      );
      mockGenerationService.updateAppliedResults.mockResolvedValue(
        stubAppliedModel,
      );

      const dto = {
        appliedResults: [
          {
            entityType: AiAppliedEntityType.TASK,
            entityId: 'created-task-id',
            action: 'CREATE',
          },
        ],
      };

      const result = await application.apply({
        generationId: GENERATION_ID,
        userId: USER_ID,
        dto,
      });

      expect(mockGenerationService.findByIdForUser).toHaveBeenCalledWith(
        GENERATION_ID,
        USER_ID,
      );
      expect(mockGenerationService.updateAppliedResults).toHaveBeenCalledWith({
        id: GENERATION_ID,
        userId: USER_ID,
        appliedResults: dto.appliedResults,
        appliedAt: expect.any(Date) as unknown,
        status: AiGenerationStatus.APPLIED,
      });

      expect(result.status).toBe(AiGenerationStatus.APPLIED);
      expect(result.appliedResults).toEqual(dto.appliedResults);
    });

    it('automatically creates a workspace when generationType is WORKSPACE_DRAFT and appliedResults is empty', async () => {
      const workspaceDraft = new AiGenerationModel(
        GENERATION_ID,
        USER_ID,
        CONVERSATION_ID,
        null,
        null,
        null,
        null,
        null,
        AiGenerationType.WORKSPACE_DRAFT,
        'msg',
        null,
        { name: 'My New Workspace', slug: 'my-new-workspace' },
        AiProvider.GEMINI,
        'gemini-2.5-flash',
        AiGenerationStatus.GENERATED,
        null,
        null,
        null,
        null,
        null,
        null,
        new Date(),
        new Date(),
      );

      mockGenerationService.findByIdForUser.mockResolvedValue(workspaceDraft);
      mockCreateWorkspaceTemplateService.create.mockResolvedValue({
        id: 'new-ws-uuid',
        name: 'My New Workspace',
        slug: 'my-new-workspace',
      });
      mockGenerationService.updateAppliedResults.mockResolvedValue(
        stubAppliedModel,
      );

      const result = await application.apply({
        generationId: GENERATION_ID,
        userId: USER_ID,
        dto: {},
      });

      expect(mockCreateWorkspaceTemplateService.create).toHaveBeenCalledWith(
        USER_ID,
        { name: 'My New Workspace' },
      );
      expect(mockGenerationService.updateAppliedResults).toHaveBeenCalledWith({
        id: GENERATION_ID,
        userId: USER_ID,
        appliedResults: [
          {
            entityType: AiAppliedEntityType.WORKSPACE,
            entityId: 'new-ws-uuid',
            action: 'CREATE',
            metadata: { name: 'My New Workspace', slug: 'my-new-workspace' },
          },
        ],
        appliedAt: expect.any(Date) as unknown,
        status: AiGenerationStatus.APPLIED,
      });
      expect(result.status).toBe(AiGenerationStatus.APPLIED);
    });

    it('automatically creates a project when generationType is PROJECT_DRAFT and appliedResults is empty', async () => {
      const projectDraft = new AiGenerationModel(
        GENERATION_ID,
        USER_ID,
        CONVERSATION_ID,
        null,
        'ws-uuid-123',
        null,
        null,
        null,
        AiGenerationType.PROJECT_DRAFT,
        'msg',
        null,
        {
          name: 'New Proj',
          key: 'NEW',
          visibility: 'PRIVATE',
          description: 'Desc',
        },
        AiProvider.GEMINI,
        'gemini-2.5-flash',
        AiGenerationStatus.GENERATED,
        null,
        null,
        null,
        null,
        null,
        null,
        new Date(),
        new Date(),
      );

      mockGenerationService.findByIdForUser.mockResolvedValue(projectDraft);
      mockCreateProjectService.createProjectWithPageBlock.mockResolvedValue({
        id: 'new-proj-uuid',
        name: 'New Proj',
        key: 'NEW',
      });
      mockGenerationService.updateAppliedResults.mockResolvedValue(
        stubAppliedModel,
      );

      const result = await application.apply({
        generationId: GENERATION_ID,
        userId: USER_ID,
        dto: {},
      });

      expect(
        mockCreateProjectService.createProjectWithPageBlock,
      ).toHaveBeenCalledWith(
        {
          workspace_id: 'ws-uuid-123',
          name: 'New Proj',
          visibility: 'PRIVATE',
          key: 'NEW',
          created_by: USER_ID,
          create_default_board: true,
        },
        mockEntityManager,
      );
      expect(result.status).toBe(AiGenerationStatus.APPLIED);
    });

    it('automatically creates a task when generationType is TASK_DRAFT and appliedResults is empty', async () => {
      const taskDraft = new AiGenerationModel(
        GENERATION_ID,
        USER_ID,
        CONVERSATION_ID,
        null,
        'ws-uuid-123',
        'proj-uuid-123',
        null,
        null,
        AiGenerationType.TASK_DRAFT,
        'msg',
        null,
        {
          tasks: [
            {
              title: 'New Task',
              description: 'Desc',
              priority: 'HIGH',
              estimatedHours: 2,
              subtasks: [],
              acceptanceCriteria: [],
              risks: [],
            },
          ],
        },
        AiProvider.GEMINI,
        'gemini-2.5-flash',
        AiGenerationStatus.GENERATED,
        null,
        null,
        null,
        null,
        null,
        null,
        new Date(),
        new Date(),
      );

      mockGenerationService.findByIdForUser.mockResolvedValue(taskDraft);
      mockEntityManager.query.mockImplementation((queryStr: unknown) => {
        const q = queryStr as string;
        if (q.includes('task_statuses')) {
          return Promise.resolve([{ id: 'status-todo-uuid' }]);
        }
        if (q.includes('task_priorities')) {
          return Promise.resolve([{ id: 'priority-high-uuid' }]);
        }
        return Promise.resolve([]);
      });
      mockCreateTaskService.create.mockResolvedValue({
        id: 'new-task-uuid',
        title: 'New Task',
      });
      mockGenerationService.updateAppliedResults.mockResolvedValue(
        stubAppliedModel,
      );

      const result = await application.apply({
        generationId: GENERATION_ID,
        userId: USER_ID,
        dto: {},
      });

      expect(mockCreateTaskService.create).toHaveBeenCalledWith(
        {
          workspaceId: 'ws-uuid-123',
          projectId: 'proj-uuid-123',
          title: 'New Task',
          description: 'Desc',
          statusId: 'status-todo-uuid',
          priorityId: 'priority-high-uuid',
          estimateMinutes: 120,
          createdBy: USER_ID,
        },
        mockEntityManager,
      );
      expect(result.status).toBe(AiGenerationStatus.APPLIED);
    });


    it('throws ConflictException when generation status is not GENERATED', async () => {
      // Mock generation already applied
      mockGenerationService.findByIdForUser.mockResolvedValue(stubAppliedModel);

      await expect(
        application.apply({
          generationId: GENERATION_ID,
          userId: USER_ID,
          dto: { appliedResults: [] },
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockGenerationService.updateAppliedResults).not.toHaveBeenCalled();
    });

    describe('WORKSPACE_TREE_DRAFT', () => {
      const stubTreeGeneratedModel = new AiGenerationModel(
        GENERATION_ID,
        USER_ID,
        CONVERSATION_ID,
        null,
        null,
        null,
        null,
        null,
        AiGenerationType.WORKSPACE_TREE_DRAFT,
        'message',
        null,
        {
          workspaces: [
            {
              name: 'Workspace 1',
              slug: 'workspace-1',
              projects: [
                {
                  name: 'Project A',
                  key: 'PROJA',
                  visibility: 'PRIVATE',
                  description: 'Project description',
                  tasks: [
                    {
                      title: 'Task Alpha',
                      description: 'Task description',
                      priority: 'HIGH',
                      estimatedHours: 8,
                    },
                  ],
                },
              ],
            },
          ],
        },
        AiProvider.GEMINI,
        'gemini-2.5-flash',
        AiGenerationStatus.GENERATED,
        null,
        null,
        null,
        null,
        null,
        null,
        new Date(),
        new Date(),
      );

      it('successfully creates workspace, project, and task and updates status to APPLIED', async () => {
        mockGenerationService.findByIdForUser.mockResolvedValue(stubTreeGeneratedModel);
        
        mockCreateWorkspaceTemplateService.create.mockResolvedValue({
          id: 'created-ws-uuid',
          name: 'Workspace 1',
          slug: 'workspace-1',
        });
        
        mockCreateProjectService.createProjectWithPageBlock.mockResolvedValue({
          id: 'created-proj-uuid',
          name: 'Project A',
          key: 'PROJA',
        });

        mockEntityManager.query.mockImplementation((sql: string) => {
          if (sql.includes('task_statuses')) {
            return Promise.resolve([{ id: 'status-todo-uuid' }]);
          }
          if (sql.includes('task_priorities')) {
            return Promise.resolve([{ id: 'priority-high-uuid' }]);
          }
          return Promise.resolve([]);
        });

        mockCreateTaskService.create.mockResolvedValue({
          id: 'created-task-uuid',
          title: 'Task Alpha',
        });

        mockGenerationService.updateAppliedResults.mockResolvedValue({
          ...stubTreeGeneratedModel,
          status: AiGenerationStatus.APPLIED,
        });

        const result = await application.apply({
          generationId: GENERATION_ID,
          userId: USER_ID,
          dto: {},
        });

        expect(mockCreateWorkspaceTemplateService.create).toHaveBeenCalledWith(
          USER_ID,
          { name: 'Workspace 1' },
          mockEntityManager,
        );

        expect(mockCreateProjectService.createProjectWithPageBlock).toHaveBeenCalledWith(
          {
            workspace_id: 'created-ws-uuid',
            name: 'Project A',
            visibility: 'PRIVATE',
            key: 'PROJA',
            created_by: USER_ID,
            create_default_board: true,
          },
          mockEntityManager,
        );

        expect(mockCreateTaskService.create).toHaveBeenCalledWith(
          {
            workspaceId: 'created-ws-uuid',
            projectId: 'created-proj-uuid',
            title: 'Task Alpha',
            description: 'Task description',
            statusId: 'status-todo-uuid',
            priorityId: 'priority-high-uuid',
            estimateMinutes: 480,
            createdBy: USER_ID,
          },
          mockEntityManager,
        );

        expect(result.status).toBe(AiGenerationStatus.APPLIED);
      });

      it('handles quota limit, updates status to APPLY_BLOCKED, and throws ConflictException', async () => {
        mockGenerationService.findByIdForUser.mockResolvedValue(stubTreeGeneratedModel);
        
        mockCreateWorkspaceTemplateService.create.mockRejectedValue(
          new ConflictException('Workspace limit exceeded'),
        );

        mockGenerationService.updateStatus.mockResolvedValue(undefined);

        await expect(
          application.apply({
            generationId: GENERATION_ID,
            userId: USER_ID,
            dto: {},
          })
        ).rejects.toThrow(ConflictException);

        expect(mockGenerationService.updateStatus).toHaveBeenCalledWith({
          id: GENERATION_ID,
          userId: USER_ID,
          status: AiGenerationStatus.APPLY_BLOCKED,
          errorMessage: 'Workspace limit exceeded',
        });
      });
    });
  });
});

