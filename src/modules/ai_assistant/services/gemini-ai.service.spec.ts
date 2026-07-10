import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  BadGatewayException,
  InternalServerErrorException,
} from '@nestjs/common';
import { GeminiAiService } from './gemini-ai.service';
import { AiGenerationType } from '../domain/enums/ai-generation-type.enum';
import { AiProvider } from '../domain/enums/ai-provider.enum';
import { AiProviderGenerationInput } from '../interfaces/services/ai-provider.service.interface';
import { AiTaskDraft } from '../interfaces/types/ai-task-draft.type';

// ---------------------------------------------------------------------------
// Mock @google/genai — không gọi real HTTP
// ---------------------------------------------------------------------------
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn(),
  Type: {
    OBJECT: 'OBJECT',
    STRING: 'STRING',
    ARRAY: 'ARRAY',
    INTEGER: 'INTEGER',
  },
  Schema: {},
}));

// ---------------------------------------------------------------------------
// Dữ liệu test
// ---------------------------------------------------------------------------

const VALID_TASK_DRAFT_JSON = JSON.stringify({
  tasks: [
    {
      title: 'Tao man hinh dang nhap',
      description: 'Xay dung man hinh dang nhap cho nguoi dung trong he thong.',
      priority: 'HIGH',
      estimatedHours: 8,
      subtasks: [
        {
          title: 'Tao form dang nhap',
          description: 'Tao form gom email, password va nut submit.',
          estimatedHours: 3,
        },
      ],
      acceptanceCriteria: ['Nguoi dung dang nhap thanh cong voi thong tin hop le'],
      risks: ['Thieu thong tin xu ly loi tu API'],
    },
  ],
});


const VALID_WORKSPACE_DRAFT_JSON = JSON.stringify({
  name: 'My Workspace',
  slug: 'my-workspace',
});

const VALID_PROJECT_DRAFT_JSON = JSON.stringify({
  name: 'My Project',
  key: 'PROJ',
  visibility: 'PRIVATE',
  description: 'This is a description that has enough characters.',
});

const BASE_INPUT: AiProviderGenerationInput = {
  userId: 'user-uuid-1',
  conversationId: 'conv-uuid-1',
  message: 'Tao task man hinh dang nhap',
  context: { workspaceId: 'ws-uuid-1', projectId: 'proj-uuid-1' },
  contextSnapshot: {
    workspaceName: 'My Workspace',
    projectName: 'My Project',
  },
};

// ---------------------------------------------------------------------------
// Helper: tạo mock GoogleGenAI client trả về text tuỳ ý
// ---------------------------------------------------------------------------
function makeMockClient(text: string | undefined, usageMetadata?: object) {
  return {
    models: {
      generateContent: jest.fn().mockResolvedValue({
        text,
        usageMetadata: usageMetadata ?? {
          promptTokenCount: 100,
          candidatesTokenCount: 50,
          totalTokenCount: 150,
        },
      }),
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('GeminiAiService', () => {
  let service: GeminiAiService;
  let configService: jest.Mocked<ConfigService>;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { GoogleGenAI } = require('@google/genai') as {
    GoogleGenAI: jest.MockedClass<new (...args: unknown[]) => unknown>;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeminiAiService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<GeminiAiService>(GeminiAiService);
    configService = module.get(ConfigService);
  });

  // -------------------------------------------------------------------------
  // Test 1: Thiếu GEMINI_API_KEY
  // -------------------------------------------------------------------------
  describe('createClient (via generateTaskDraft)', () => {
    it('throws InternalServerErrorException when GEMINI_API_KEY is not configured', async () => {
      configService.get.mockReturnValue(undefined);

      let caught: unknown;
      try {
        await service.generateTaskDraft(BASE_INPUT);
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(InternalServerErrorException);
      expect((caught as Error).message).toBe(
        'GEMINI_API_KEY is not configured',
      );
    });

    it('throws InternalServerErrorException when GEMINI_API_KEY is blank string', async () => {
      configService.get.mockReturnValue('   ');

      let caught: unknown;
      try {
        await service.generateTaskDraft(BASE_INPUT);
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(InternalServerErrorException);
    });
  });

  // -------------------------------------------------------------------------
  // Test 2: Gemini trả empty output
  // -------------------------------------------------------------------------
  describe('generateTaskDraft — empty response', () => {
    beforeEach(() => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-api-key';
        if (key === 'GEMINI_MODEL') return 'gemini-2.5-flash';
        return undefined;
      });
    });

    it('throws BadGatewayException when Gemini returns empty string', async () => {
      GoogleGenAI.mockImplementation(() => makeMockClient(''));

      await expect(service.generateTaskDraft(BASE_INPUT)).rejects.toThrow(
        BadGatewayException,
      );
      await expect(service.generateTaskDraft(BASE_INPUT)).rejects.toThrow(
        'AI provider returned empty response',
      );
    });

    it('throws BadGatewayException when Gemini returns whitespace-only string', async () => {
      GoogleGenAI.mockImplementation(() => makeMockClient('   '));

      await expect(service.generateTaskDraft(BASE_INPUT)).rejects.toThrow(
        BadGatewayException,
      );
    });

    it('throws BadGatewayException when Gemini returns undefined text', async () => {
      GoogleGenAI.mockImplementation(() => makeMockClient(undefined));

      await expect(service.generateTaskDraft(BASE_INPUT)).rejects.toThrow(
        BadGatewayException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Test 3: Gemini trả invalid JSON
  // -------------------------------------------------------------------------
  describe('generateTaskDraft — invalid JSON', () => {
    beforeEach(() => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-api-key';
        return undefined;
      });
    });

    it('throws BadGatewayException when Gemini returns malformed JSON', async () => {
      GoogleGenAI.mockImplementation(() => makeMockClient('{invalid json >>>'));

      await expect(service.generateTaskDraft(BASE_INPUT)).rejects.toThrow(
        BadGatewayException,
      );
      await expect(service.generateTaskDraft(BASE_INPUT)).rejects.toThrow(
        'AI provider returned invalid JSON',
      );
    });

    it('throws BadGatewayException when Gemini returns a raw string (not JSON)', async () => {
      GoogleGenAI.mockImplementation(() =>
        makeMockClient('Toi khong hieu yeu cau'),
      );

      await expect(service.generateTaskDraft(BASE_INPUT)).rejects.toThrow(
        BadGatewayException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Test 4: Gemini trả JSON sai TaskDraft schema
  // -------------------------------------------------------------------------
  describe('generateTaskDraft — invalid TaskDraft schema', () => {
    beforeEach(() => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-api-key';
        return undefined;
      });
    });

    it('throws BadGatewayException when priority is not a valid enum value', async () => {
      const invalidPriority = JSON.stringify({
        tasks: [
          {
            title: 'Valid Title Here',
            description: 'Valid description with enough characters here.',
            priority: 'BLOCKER', // sai enum
            estimatedHours: 8,
            subtasks: [
              {
                title: 'Sub one',
                description: 'Description for sub one task.',
                estimatedHours: 2,
              },
            ],
            acceptanceCriteria: ['Criteria one'],
            risks: [],
          },
        ],
      });
      GoogleGenAI.mockImplementation(() => makeMockClient(invalidPriority));

      await expect(service.generateTaskDraft(BASE_INPUT)).rejects.toThrow(
        BadGatewayException,
      );
      await expect(service.generateTaskDraft(BASE_INPUT)).rejects.toThrow(
        'AI provider returned invalid task draft',
      );
    });

    it('throws BadGatewayException when subtasks array is empty (violates minItems)', async () => {
      const noSubtasks = JSON.stringify({
        tasks: [
          {
            title: 'Valid Title Here',
            description: 'Valid description with enough characters here.',
            priority: 'HIGH',
            estimatedHours: 8,
            subtasks: [], // minItems = 1
            acceptanceCriteria: ['Criteria one'],
            risks: [],
          },
        ],
      });
      GoogleGenAI.mockImplementation(() => makeMockClient(noSubtasks));

      await expect(service.generateTaskDraft(BASE_INPUT)).rejects.toThrow(
        BadGatewayException,
      );
    });

    it('throws BadGatewayException when output contains forbidden fields (id, assignee, workspaceId)', async () => {
      const withForbiddenFields = JSON.stringify({
        tasks: [
          {
            title: 'Valid Title Here',
            description: 'Valid description with enough characters here.',
            priority: 'HIGH',
            estimatedHours: 8,
            subtasks: [
              {
                title: 'Sub one',
                description: 'Description for sub one task.',
                estimatedHours: 2,
              },
            ],
            acceptanceCriteria: ['Criteria one'],
            risks: [],
            // Các fields bị cấm
            id: 'task-123',
            assignee: 'user-xyz',
            workspaceId: 'ws-1',
          },
        ],
      });
      GoogleGenAI.mockImplementation(() => makeMockClient(withForbiddenFields));

      await expect(service.generateTaskDraft(BASE_INPUT)).rejects.toThrow(

        BadGatewayException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Test 5: Gemini trả TaskDraft hợp lệ → map đúng sang AiGenerationResult
  // -------------------------------------------------------------------------
  describe('generateTaskDraft — success path', () => {
    it('returns AiGenerationResult with correct provider, model, tokens, and outputData', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-api-key';
        if (key === 'GEMINI_MODEL') return 'gemini-2.5-flash';
        return undefined;
      });

      GoogleGenAI.mockImplementation(() =>
        makeMockClient(VALID_TASK_DRAFT_JSON, {
          promptTokenCount: 200,
          candidatesTokenCount: 80,
          totalTokenCount: 280,
        }),
      );

      const result = await service.generateTaskDraft(BASE_INPUT);

      // Provider và model
      expect(result.provider).toBe(AiProvider.GEMINI);
      expect(result.model).toBe('gemini-2.5-flash');

      // Token usage
      expect(result.inputTokens).toBe(200);
      expect(result.outputTokens).toBe(80);
      expect(result.totalTokens).toBe(280);

      // outputData phải chứa đúng task draft
      const outputData = result.outputData as unknown as AiTaskDraft;
      expect(outputData.tasks[0]).toMatchObject({
        title: 'Tao man hinh dang nhap',
        priority: 'HIGH',
        estimatedHours: 8,
      });
      expect(Array.isArray(outputData.tasks[0].subtasks)).toBe(true);
      expect(Array.isArray(outputData.tasks[0].acceptanceCriteria)).toBe(true);

      // assistantMessage phải đề cập tên task và số subtask
      expect(result.assistantMessage).toContain('Tao man hinh dang nhap');
      expect(result.assistantMessage).toContain('1 công việc con');
    });


    it('uses GEMINI_DEFAULT_MODEL (gemini-2.5-flash) as fallback when GEMINI_MODEL env is not set', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-api-key';
        // GEMINI_MODEL không được set → fallback
        return undefined;
      });

      GoogleGenAI.mockImplementation(() =>
        makeMockClient(VALID_TASK_DRAFT_JSON),
      );

      const result = await service.generateTaskDraft(BASE_INPUT);

      expect(result.model).toBe('gemini-2.5-flash');
    });

    it('returns null token fields when Gemini does not return usageMetadata', async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-api-key';
        return undefined;
      });

      // Không có usageMetadata field trong response
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: jest.fn().mockResolvedValue({
            text: VALID_TASK_DRAFT_JSON,
            // usageMetadata deliberately omitted
          }),
        },
      }));

      const result = await service.generateTaskDraft(BASE_INPUT);

      expect(result.inputTokens).toBeNull();
      expect(result.outputTokens).toBeNull();
      expect(result.totalTokens).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Test 8: generateWorkspaceDraft success and failure paths
  // -------------------------------------------------------------------------
  describe('generateWorkspaceDraft', () => {
    beforeEach(() => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-api-key';
        return undefined;
      });
    });

    it('returns AiGenerationResult when Gemini returns valid workspace draft', async () => {
      GoogleGenAI.mockImplementation(() =>
        makeMockClient(VALID_WORKSPACE_DRAFT_JSON, {
          promptTokenCount: 50,
          candidatesTokenCount: 20,
          totalTokenCount: 70,
        }),
      );

      const result = await service.generateWorkspaceDraft(BASE_INPUT);

      expect(result.provider).toBe(AiProvider.GEMINI);
      expect(result.outputData).toMatchObject({
        name: 'My Workspace',
        slug: 'my-workspace',
      });
      expect(result.assistantMessage).toContain(
        'Không gian làm việc "My Workspace"',
      );
      expect(result.totalTokens).toBe(70);
    });

    it('throws BadGatewayException when Gemini returns invalid workspace draft', async () => {
      const invalid = JSON.stringify({
        name: 'A',
        slug: 'invalid_slug_with_Caps',
      });
      GoogleGenAI.mockImplementation(() => makeMockClient(invalid));

      await expect(service.generateWorkspaceDraft(BASE_INPUT)).rejects.toThrow(
        BadGatewayException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Test 9: generateProjectDraft success and failure paths
  // -------------------------------------------------------------------------
  describe('generateProjectDraft', () => {
    beforeEach(() => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-api-key';
        return undefined;
      });
    });

    it('returns AiGenerationResult when Gemini returns valid project draft', async () => {
      GoogleGenAI.mockImplementation(() =>
        makeMockClient(VALID_PROJECT_DRAFT_JSON, {
          promptTokenCount: 80,
          candidatesTokenCount: 40,
          totalTokenCount: 120,
        }),
      );

      const result = await service.generateProjectDraft(BASE_INPUT);

      expect(result.provider).toBe(AiProvider.GEMINI);
      expect(result.outputData).toMatchObject({
        name: 'My Project',
        key: 'PROJ',
        visibility: 'PRIVATE',
      });
      expect(result.assistantMessage).toContain(
        'Dự án "My Project" [PROJ]',
      );
      expect(result.totalTokens).toBe(120);
    });

    it('throws BadGatewayException when Gemini returns invalid project draft', async () => {
      const invalid = JSON.stringify({
        name: 'A',
        key: '123',
        visibility: 'PUBLIC',
      });
      GoogleGenAI.mockImplementation(() => makeMockClient(invalid));

      await expect(service.generateProjectDraft(BASE_INPUT)).rejects.toThrow(
        BadGatewayException,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Test 10: classifyIntent success and fallback paths
  // -------------------------------------------------------------------------
  describe('classifyIntent', () => {
    beforeEach(() => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'GEMINI_API_KEY') return 'test-api-key';
        return undefined;
      });
    });

    it('returns AiGenerationType.TASK_DRAFT when Gemini returns TASK_DRAFT', async () => {
      GoogleGenAI.mockImplementation(() => makeMockClient('TASK_DRAFT'));
      const result = await service.classifyIntent('Tạo giúp tôi 5 công việc');
      expect(result).toBe(AiGenerationType.TASK_DRAFT);
    });

    it('returns AiGenerationType.WORKSPACE_TREE_DRAFT when Gemini returns WORKSPACE_TREE_DRAFT', async () => {
      GoogleGenAI.mockImplementation(() => makeMockClient('WORKSPACE_TREE_DRAFT'));
      const result = await service.classifyIntent('Tạo một workspace mới');
      expect(result).toBe(AiGenerationType.WORKSPACE_TREE_DRAFT);
    });

    it('returns NORMAL when Gemini returns NORMAL or other text', async () => {
      GoogleGenAI.mockImplementation(() => makeMockClient('NORMAL'));
      const result = await service.classifyIntent('Chào bạn');
      expect(result).toBe('NORMAL');
    });

    it('returns NORMAL as fallback when Gemini request throws error', async () => {
      GoogleGenAI.mockImplementation(() => ({
        models: {
          generateContent: jest.fn().mockRejectedValue(new Error('Gemini error')),
        },
      }));
      const result = await service.classifyIntent('Chào bạn');
      expect(result).toBe('NORMAL');
    });
  });
});
