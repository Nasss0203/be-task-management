import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadGatewayException } from '@nestjs/common';
import { SendAiMessageApplicationImpl } from './send-ai-message.application';
import { AI_ASSISTANT_TYPES } from '../interfaces/types';
import { PERMISSION_TYPES } from 'src/modules/permission/interfaces/types';
import { AiGenerationStatus } from '../domain/enums/ai-generation-status.enum';
import { AiGenerationType } from '../domain/enums/ai-generation-type.enum';
import { AiMessageRole } from '../domain/enums/ai-message-role.enum';
import { AiProvider } from '../domain/enums/ai-provider.enum';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { AiConversationModel } from '../domain/models/ai-conversation.model';
import { AiMessageModel } from '../domain/models/ai-message.model';
import { AiGenerationModel } from '../domain/models/ai-generation.model';

// ---------------------------------------------------------------------------
// Fixtures — stub models
// ---------------------------------------------------------------------------

const CONVERSATION_ID = 'conv-uuid-1';
const USER_ID = 'user-uuid-1';
const WORKSPACE_ID = 'ws-uuid-1';
const PROJECT_ID = 'proj-uuid-1';
const GENERATION_ID = 'gen-uuid-1';
const USER_MSG_ID = 'msg-uuid-1';
const ASSISTANT_MSG_ID = 'msg-uuid-2';

const stubConversation = new AiConversationModel(
  CONVERSATION_ID,
  USER_ID,
  WORKSPACE_ID,
  'Test Conversation',
  null,
  new Date('2024-01-01'),
  new Date('2024-01-01'),
);

const stubUserMessage = new AiMessageModel(
  USER_MSG_ID,
  CONVERSATION_ID,
  AiMessageRole.USER,
  'Tao task dang nhap',
  { workspaceId: WORKSPACE_ID, projectId: PROJECT_ID },
  null,
  new Date('2024-01-01'),
);

const stubGenerationProcessing = new AiGenerationModel(
  GENERATION_ID,
  USER_ID,
  CONVERSATION_ID,
  USER_MSG_ID,
  WORKSPACE_ID,
  PROJECT_ID,
  null,
  null,
  AiGenerationType.TASK_DRAFT,
  'Tao task dang nhap',
  { workspaceId: WORKSPACE_ID, projectId: PROJECT_ID },
  null,
  AiProvider.GEMINI,
  'gemini-2.5-flash',
  AiGenerationStatus.PROCESSING,
  null,
  null,
  null,
  null,
  null,
  null,
  new Date('2024-01-01'),
  new Date('2024-01-01'),
);

const stubGenerationGenerated = new AiGenerationModel(
  GENERATION_ID,
  USER_ID,
  CONVERSATION_ID,
  USER_MSG_ID,
  WORKSPACE_ID,
  PROJECT_ID,
  null,
  null,
  AiGenerationType.TASK_DRAFT,
  'Tao task dang nhap',
  { workspaceId: WORKSPACE_ID, projectId: PROJECT_ID },
  { title: 'Tao man hinh', priority: 'HIGH', estimatedHours: 8, subtasks: [] },
  AiProvider.GEMINI,
  'gemini-2.5-flash',
  AiGenerationStatus.GENERATED,
  null,
  100,
  50,
  150,
  null,
  null,
  new Date('2024-01-01'),
  new Date('2024-01-01'),
);

const stubAssistantMessage = new AiMessageModel(
  ASSISTANT_MSG_ID,
  CONVERSATION_ID,
  AiMessageRole.ASSISTANT,
  'Da tao ban nhap Task',
  { workspaceId: WORKSPACE_ID, projectId: PROJECT_ID },
  {
    generationId: GENERATION_ID,
    generationType: AiGenerationType.TASK_DRAFT,
  },
  new Date('2024-01-01'),
);

const VALID_AI_RESULT = {
  assistantMessage: 'Da tao ban nhap Task "Tao man hinh" voi 1 subtasks.',
  outputData: {
    tasks: [
      {
        title: 'Tao man hinh',
        priority: 'HIGH',
        estimatedHours: 8,
        subtasks: [],
        acceptanceCriteria: [],
        risks: [],
      },
    ],
  },
  provider: AiProvider.GEMINI,
  model: 'gemini-2.5-flash',
  inputTokens: 100,
  outputTokens: 50,
  totalTokens: 150,
};

const RESOLVED_CONTEXT = {
  context: {
    workspaceId: WORKSPACE_ID,
    projectId: PROJECT_ID,
    boardId: null,
    sprintId: null,
  },
  contextSnapshot: {
    workspaceName: 'My Workspace',
    projectName: 'My Project',
  },
};

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockConversationService = {
  findByIdForUser: jest.fn(),
  update: jest.fn(),
};

const mockMessageService = {
  create: jest.fn(),
};

const mockGenerationService = {
  create: jest.fn(),
  updateGeneratedResult: jest.fn(),
  updateStatus: jest.fn().mockResolvedValue(undefined),
};

const mockAiProviderService = {
  generateTaskDraft: jest.fn(),
  generateWorkspaceDraft: jest.fn(),
  generateProjectDraft: jest.fn(),
  classifyIntent: jest.fn(),
};

const mockContextSnapshotRepository = {
  resolveTaskDraftContext: jest.fn(),
};

const mockFindPermissionService = {
  findPermissionsByUserAndWorkspace: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
};

const mockApplyAiGenerationApplication = {
  apply: jest.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('SendAiMessageApplicationImpl', () => {
  let application: SendAiMessageApplicationImpl;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Defaults cho happy path
    mockConversationService.findByIdForUser.mockResolvedValue(stubConversation);
    mockConversationService.update.mockResolvedValue(stubConversation);
    mockMessageService.create
      .mockResolvedValueOnce(stubUserMessage) // user message
      .mockResolvedValueOnce(stubAssistantMessage); // assistant message
    mockGenerationService.create.mockResolvedValue(stubGenerationProcessing);
    mockGenerationService.updateGeneratedResult.mockResolvedValue(
      stubGenerationGenerated,
    );
    mockContextSnapshotRepository.resolveTaskDraftContext.mockResolvedValue(
      RESOLVED_CONTEXT,
    );
    mockFindPermissionService.findPermissionsByUserAndWorkspace.mockResolvedValue(
      ['task.create', 'project.create'], // PERMISSIONS.TASK_CREATE = 'task.create', PROJECT_CREATE = 'project.create'
    );
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'GEMINI_MODEL') return 'gemini-2.5-flash';
      return undefined;
    });
    mockApplyAiGenerationApplication.apply.mockResolvedValue(
      stubGenerationGenerated,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SendAiMessageApplicationImpl,
        {
          provide: AI_ASSISTANT_TYPES.services.AiConversationService,
          useValue: mockConversationService,
        },
        {
          provide: AI_ASSISTANT_TYPES.services.AiMessageService,
          useValue: mockMessageService,
        },
        {
          provide: AI_ASSISTANT_TYPES.services.AiGenerationService,
          useValue: mockGenerationService,
        },
        {
          provide: AI_ASSISTANT_TYPES.services.AiProviderService,
          useValue: mockAiProviderService,
        },
        {
          provide: AI_ASSISTANT_TYPES.repositories.AiContextSnapshotRepository,
          useValue: mockContextSnapshotRepository,
        },
        {
          provide: PERMISSION_TYPES.services.FindPermissionService,
          useValue: mockFindPermissionService,
        },
        {
          provide: AI_ASSISTANT_TYPES.applications.ApplyAiGenerationApplication,
          useValue: mockApplyAiGenerationApplication,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    application = module.get<SendAiMessageApplicationImpl>(
      SendAiMessageApplicationImpl,
    );
  });

  // -------------------------------------------------------------------------
  // Test 6: Provider thành công → updateGeneratedResult với GENERATED
  // -------------------------------------------------------------------------
  describe('send — success path (TASK_DRAFT)', () => {
    it('calls updateGeneratedResult with GENERATED status when provider succeeds', async () => {
      mockAiProviderService.generateTaskDraft.mockResolvedValue(
        VALID_AI_RESULT,
      );

      const result = await application.send({
        conversationId: CONVERSATION_ID,
        userId: USER_ID,
        systemRole: SystemRole.USER,
        dto: {
          message: 'Tao task dang nhap',
          generationType: AiGenerationType.TASK_DRAFT,
          workspaceId: WORKSPACE_ID,
          projectId: PROJECT_ID,
        },
      });

      // updateGeneratedResult được gọi với GENERATED
      expect(mockGenerationService.updateGeneratedResult).toHaveBeenCalledWith(
        expect.objectContaining({
          id: GENERATION_ID,
          status: AiGenerationStatus.GENERATED,
          outputData: VALID_AI_RESULT.outputData,
          provider: AiProvider.GEMINI,
          model: 'gemini-2.5-flash',
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
        }),
      );

      // updateStatus(FAILED) không được gọi
      expect(mockGenerationService.updateStatus).not.toHaveBeenCalled();

      // assistantMessage phải có trong response
      expect(result.assistantMessage).toBeDefined();
      expect(result.generation).toBeDefined();
      expect(result.userMessage).toBeDefined();
    });

    it('creates assistant message with correct metadata (generationId and generationType)', async () => {
      mockAiProviderService.generateTaskDraft.mockResolvedValue(
        VALID_AI_RESULT,
      );

      await application.send({
        conversationId: CONVERSATION_ID,
        userId: USER_ID,
        systemRole: SystemRole.USER,
        dto: {
          message: 'Tao task dang nhap',
          generationType: AiGenerationType.TASK_DRAFT,
          workspaceId: WORKSPACE_ID,
          projectId: PROJECT_ID,
        },
      });

      // Lần create thứ 2 là assistant message, phải có metadata đúng
      const calls = mockMessageService.create.mock.calls as unknown[][];
      expect(calls.length).toBe(2);

      const assistantMessageCall = calls[1][0] as Record<string, unknown>;
      expect(assistantMessageCall.role).toBe(AiMessageRole.ASSISTANT);
      expect(assistantMessageCall.metadata).toMatchObject({
        generationId: GENERATION_ID,
        generationType: AiGenerationType.TASK_DRAFT,
      });
    });
  });

  // -------------------------------------------------------------------------
  // Test 7: Provider ném lỗi → updateStatus với FAILED, không tạo assistant message
  // -------------------------------------------------------------------------
  describe('send — failure path (TASK_DRAFT)', () => {
    it('calls updateStatus with FAILED status when provider throws an error', async () => {
      mockAiProviderService.generateTaskDraft.mockRejectedValue(
        new BadGatewayException('AI provider request failed'),
      );

      await expect(
        application.send({
          conversationId: CONVERSATION_ID,
          userId: USER_ID,
          systemRole: SystemRole.USER,
          dto: {
            message: 'Tao task dang nhap',
            generationType: AiGenerationType.TASK_DRAFT,
            workspaceId: WORKSPACE_ID,
            projectId: PROJECT_ID,
          },
        }),
      ).rejects.toThrow(BadGatewayException);

      // updateStatus được gọi với FAILED
      expect(mockGenerationService.updateStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          id: GENERATION_ID,
          status: AiGenerationStatus.FAILED,
        }),
      );

      // updateGeneratedResult không được gọi
      expect(
        mockGenerationService.updateGeneratedResult,
      ).not.toHaveBeenCalled();
    });

    it('does not create assistant message when provider fails', async () => {
      mockAiProviderService.generateTaskDraft.mockRejectedValue(
        new BadGatewayException('AI provider request failed'),
      );

      await expect(
        application.send({
          conversationId: CONVERSATION_ID,
          userId: USER_ID,
          systemRole: SystemRole.USER,
          dto: {
            message: 'Tao task dang nhap',
            generationType: AiGenerationType.TASK_DRAFT,
            workspaceId: WORKSPACE_ID,
            projectId: PROJECT_ID,
          },
        }),
      ).rejects.toThrow();

      // Chỉ có 1 lần create (user message). Không có assistant message.
      expect(mockMessageService.create).toHaveBeenCalledTimes(1);
      const onlyCall = (
        mockMessageService.create.mock.calls as unknown[][]
      )[0][0] as Record<string, unknown>;
      expect(onlyCall.role).toBe(AiMessageRole.USER);
    });

    it('stores a safe error message without exposing raw error details', async () => {
      mockAiProviderService.generateTaskDraft.mockRejectedValue(
        new BadGatewayException('AI provider request failed'),
      );

      await expect(
        application.send({
          conversationId: CONVERSATION_ID,
          userId: USER_ID,
          systemRole: SystemRole.USER,
          dto: {
            message: 'Tao task dang nhap',
            generationType: AiGenerationType.TASK_DRAFT,
            workspaceId: WORKSPACE_ID,
            projectId: PROJECT_ID,
          },
        }),
      ).rejects.toThrow();

      const updateStatusCall = (
        mockGenerationService.updateStatus.mock.calls as unknown[][]
      )[0][0] as Record<string, unknown>;

      // errorMessage phải có và không được chứa data nhạy cảm
      expect(updateStatusCall.errorMessage).toBeDefined();
      expect(typeof updateStatusCall.errorMessage).toBe('string');
      expect(updateStatusCall.errorMessage).not.toContain('API_KEY');
    });
  });

  // -------------------------------------------------------------------------
  // Test 8: WORKSPACE_DRAFT generation happy path
  // -------------------------------------------------------------------------
  describe('send — success path (WORKSPACE_DRAFT)', () => {
    it('creates workspace draft without checking workspace permissions and updates status to GENERATED', async () => {
      const workspaceDraftResult = {
        assistantMessage: 'Da tao ban nhap Workspace "My Workspace".',
        outputData: { name: 'My Workspace', slug: 'my-workspace' },
        provider: AiProvider.GEMINI,
        model: 'gemini-2.5-flash',
        inputTokens: 50,
        outputTokens: 20,
        totalTokens: 70,
      };

      mockAiProviderService.generateWorkspaceDraft.mockResolvedValue(
        workspaceDraftResult,
      );

      const result = await application.send({
        conversationId: CONVERSATION_ID,
        userId: USER_ID,
        systemRole: SystemRole.USER,
        dto: {
          message: 'Tao workspace cong ty',
          generationType: AiGenerationType.WORKSPACE_DRAFT,
        },
      });

      expect(
        mockFindPermissionService.findPermissionsByUserAndWorkspace,
      ).not.toHaveBeenCalled();
      expect(mockGenerationService.updateGeneratedResult).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AiGenerationStatus.GENERATED,
          outputData: workspaceDraftResult.outputData,
        }),
      );
      expect(result.assistantMessage).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Test 9: PROJECT_DRAFT generation happy path and permission checks
  // -------------------------------------------------------------------------
  describe('send — PROJECT_DRAFT', () => {
    const projectDraftResult = {
      assistantMessage: 'Da tao ban nhap Project "My Project" [PROJ].',
      outputData: {
        name: 'My Project',
        key: 'PROJ',
        visibility: 'PRIVATE',
        description: 'desc',
      },
      provider: AiProvider.GEMINI,
      model: 'gemini-2.5-flash',
      inputTokens: 80,
      outputTokens: 40,
      totalTokens: 120,
    };

    it('creates project draft when user has project.create permission', async () => {
      mockAiProviderService.generateProjectDraft.mockResolvedValue(
        projectDraftResult,
      );

      const result = await application.send({
        conversationId: CONVERSATION_ID,
        userId: USER_ID,
        systemRole: SystemRole.USER,
        dto: {
          message: 'Tao project di dong',
          generationType: AiGenerationType.PROJECT_DRAFT,
          workspaceId: WORKSPACE_ID,
        },
      });

      expect(
        mockFindPermissionService.findPermissionsByUserAndWorkspace,
      ).toHaveBeenCalledWith(USER_ID, WORKSPACE_ID);
      expect(mockGenerationService.updateGeneratedResult).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AiGenerationStatus.GENERATED,
          outputData: projectDraftResult.outputData,
        }),
      );
      expect(result.assistantMessage).toBeDefined();
    });

    it('throws ForbiddenException when user lacks project.create permission', async () => {
      // Mock user lacking project.create permission
      mockFindPermissionService.findPermissionsByUserAndWorkspace.mockResolvedValue(
        ['task.create'], // lacks project.create
      );

      await expect(
        application.send({
          conversationId: CONVERSATION_ID,
          userId: USER_ID,
          systemRole: SystemRole.USER,
          dto: {
            message: 'Tao project di dong',
            generationType: AiGenerationType.PROJECT_DRAFT,
            workspaceId: WORKSPACE_ID,
          },
        }),
      ).rejects.toThrow(
        'You do not have required permissions to create project',
      );

      expect(mockGenerationService.create).not.toHaveBeenCalled();
    });
  });

  describe('intent classification integration', () => {
    it('automatically classifies intent and runs task draft flow when classifyIntent returns TASK_DRAFT', async () => {
      mockConversationService.findByIdForUser.mockResolvedValue(
        stubConversation,
      );
      mockAiProviderService.classifyIntent.mockResolvedValue(
        AiGenerationType.TASK_DRAFT,
      );
      mockContextSnapshotRepository.resolveTaskDraftContext.mockResolvedValue(
        RESOLVED_CONTEXT,
      );
      mockFindPermissionService.findPermissionsByUserAndWorkspace.mockResolvedValue(
        ['task.create'],
      );

      mockMessageService.create.mockResolvedValue(stubUserMessage);
      mockGenerationService.create.mockResolvedValue(stubGenerationProcessing);
      mockAiProviderService.generateTaskDraft.mockResolvedValue(
        stubGenerationGenerated,
      );
      mockGenerationService.updateGeneratedResult.mockResolvedValue(
        stubGenerationGenerated,
      );

      const result = await application.send({
        conversationId: CONVERSATION_ID,
        userId: USER_ID,
        systemRole: SystemRole.USER,
        dto: {
          message: 'Tạo giúp tôi 5 công việc lập trình',
          workspaceId: WORKSPACE_ID,
        },
      });

      expect(mockAiProviderService.classifyIntent).toHaveBeenCalledWith(
        'Tạo giúp tôi 5 công việc lập trình',
      );
      expect(mockAiProviderService.generateTaskDraft).toHaveBeenCalled();
      expect(result.generation).toBeDefined();
      expect(result.generation?.generationType).toBe(
        AiGenerationType.TASK_DRAFT,
      );
    });

    it('returns null assistant message and generation when classifyIntent returns NORMAL', async () => {
      mockConversationService.findByIdForUser.mockResolvedValue(
        stubConversation,
      );
      mockAiProviderService.classifyIntent.mockResolvedValue('NORMAL');
      mockMessageService.create.mockResolvedValue(stubUserMessage);

      const result = await application.send({
        conversationId: CONVERSATION_ID,
        userId: USER_ID,
        systemRole: SystemRole.USER,
        dto: {
          message: 'Chào bạn',
        },
      });

      expect(mockAiProviderService.classifyIntent).toHaveBeenCalledWith(
        'Chào bạn',
      );
      expect(mockGenerationService.create).not.toHaveBeenCalled();
      expect(result.userMessage).toBeDefined();
      expect(result.assistantMessage).toBeNull();
      expect(result.generation).toBeNull();
    });
  });
});
