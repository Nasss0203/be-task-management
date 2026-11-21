import { ValidationPipe, VersioningType } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, HttpAdapterHost, Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { HttpExceptionFilter } from 'src/common/filter/http-exception';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { TransformInterceptor } from 'src/common/interceptor/transform.interceptor';
import { JwtStrategy } from 'src/common/strategy/jwt.strategy';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { passThroughAskLog } from '../../../application/ask-log/ai-ask-event-recorder.fixture';
import type { AiPageContextResponseDto } from '../../../application/dto/response/ai-page-context.response.dto';
import type { AiRuntimePort } from '../../../application/ports/ai-runtime.port';
import { PageIntentExtractionService } from '../../../application/resolution/page-intent-extraction.service';
import { PageReferenceResolver } from '../../../application/resolution/page-reference-resolver.service';
import { AiAskService } from '../../../application/services/ai-ask.service';
import { AiAssistantService } from '../../../application/services/ai-assistant.service';
import { AiModificationPlannerService } from '../../../application/services/ai-modification-planner.service';
import { AiPageInstructionPlannerService } from '../../../application/services/ai-page-instruction-planner.service';
import {
  AI_DAILY_LIMIT_REACHED,
  AiUsageQuotaService,
} from '../../../application/services/ai-usage-quota.service';
import type { AiUsageRepository } from '../../../domain/repositories/ai-usage.repository';
import { AiAssistantController } from './ai-assistant.controller';

const secret = 'daily-limit-http-test-only-secret';
const workspaceId = '550e8400-e29b-41d4-a716-446655440000';
const conversationId = '6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b';

function pageContext(): AiPageContextResponseDto {
  return {
    schemaVersion: 1,
    builtAt: '2026-11-21T08:00:00.000Z',
    page: {
      id: 'page-1',
      workspaceId,
      teamspaceId: null,
      parentPageId: null,
      title: 'Release 2.0',
      icon: null,
      coverUrl: null,
      updatedAt: '2026-11-21T07:00:00.000Z',
    },
    blocks: [],
    databaseReferences: [],
    databases: [],
    completeness: {
      blocks: { total: 0, included: 0, truncated: false },
      databases: { total: 0, included: 0, truncated: false },
      rows: [],
      textTruncated: false,
    },
  } as unknown as AiPageContextResponseDto;
}

describe('AI daily Gemini limit on the AI endpoints', () => {
  let app: INestApplication<Server>;
  let token: string;
  const runtime = { execute: jest.fn() };
  const unitOfWork = { runInTransaction: jest.fn() };
  const countByUser = jest.fn();

  beforeAll(async () => {
    const quota = new AiUsageQuotaService(
      { countByUser } as unknown as AiUsageRepository,
      new ConfigService({ AI_GEMINI_DAILY_CALLS_PER_USER: '3' }),
    );
    const conversation = {
      getId: () => conversationId,
      getWorkspaceId: () => workspaceId,
    };
    const access = {
      assertCanRead: jest.fn().mockResolvedValue(undefined),
      assertWorkspaceRead: jest.fn().mockResolvedValue(undefined),
      getReadablePage: jest.fn(),
    };
    const assistant = new AiAssistantService(
      { findByIdAndUserId: jest.fn().mockResolvedValue(conversation) } as never,
      { save: jest.fn() } as never,
      { save: jest.fn() } as never,
      { save: jest.fn() } as never,
      runtime as unknown as AiRuntimePort,
      unitOfWork as never,
      access as never,
      {} as never,
      {} as never,
      quota,
    );
    const modificationPlanner = new AiModificationPlannerService(
      { execute: jest.fn().mockResolvedValue(pageContext()) } as never,
      { save: jest.fn(), findByIdAndUserId: jest.fn() } as never,
      { save: jest.fn() } as never,
      { save: jest.fn() } as never,
      { save: jest.fn() } as never,
      runtime as unknown as AiRuntimePort,
      unitOfWork as never,
      access as never,
      { validate: jest.fn() } as never,
      quota,
    );
    const candidate = {
      pageId: 'page-1',
      workspaceId,
      title: 'Release 2.0',
      parentPageId: null,
      teamspaceId: null,
    };
    const pagePlanner = new AiPageInstructionPlannerService(
      {
        extract: jest.fn().mockResolvedValue({
          result: {
            intent: 'MODIFY_PAGE',
            referenceType: 'TITLE',
            pageReference: 'Release 2.0',
            instruction: 'Thêm to-do "Gọi khách"',
            needsClarification: false,
          },
        }),
      } as unknown as PageIntentExtractionService,
      {
        resolve: jest.fn().mockResolvedValue({
          status: 'RESOLVED',
          page: candidate,
          resolutionMethod: 'EXACT_TITLE',
          confidence: 1,
        }),
        resolveFromSentence: jest
          .fn()
          .mockResolvedValue({ status: 'NOT_FOUND', candidates: [] }),
        resolveSimilarTitles: jest
          .fn()
          .mockResolvedValue({ status: 'NOT_FOUND', candidates: [] }),
      } as unknown as PageReferenceResolver,
      modificationPlanner,
    );
    const ask = new AiAskService(
      {
        classify: jest.fn().mockResolvedValue({
          result: {
            intent: 'CREATE_PAGE',
            writingAction: null,
            language: null,
            needsClarification: false,
          },
          provider: 'deterministic',
          model: 'rules',
        }),
      } as never,
      access as never,
      { findByIdAndUserId: jest.fn() } as never,
      { execute: jest.fn().mockResolvedValue({ id: conversationId }) } as never,
      assistant,
      pagePlanner,
      passThroughAskLog(),
    );

    const dependencies = Reflect.getMetadata(
      'design:paramtypes',
      AiAssistantController,
    ) as Array<new (...args: never[]) => unknown>;
    const real = new Map<unknown, unknown>([
      [AiAskService, ask],
      [AiAssistantService, assistant],
      [AiModificationPlannerService, modificationPlanner],
      [AiPageInstructionPlannerService, pagePlanner],
    ]);
    const module = await Test.createTestingModule({
      imports: [PassportModule, JwtModule.register({ secret })],
      controllers: [AiAssistantController],
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: new ConfigService({ JWT_ACCESS_TOKEN_SECRET: secret }),
        },
        {
          provide: IDENTITY_TYPES.repositories.UserRepository,
          useValue: {
            findProfileById: jest
              .fn()
              .mockResolvedValue({ id: 'authenticated-actor', isActive: true }),
          },
        },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        ...dependencies.map((provide) => ({
          provide,
          useValue: real.get(provide) ?? {},
        })),
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: ['1'] });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor(module.get(Reflector)));
    app.useGlobalFilters(new HttpExceptionFilter(app.get(HttpAdapterHost)));
    await app.init();
    token = module.get(JwtService).sign({ sub: 'authenticated-actor' });
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    countByUser.mockResolvedValue(3);
  });

  it.each([
    ['ai-assistant/ask', { workspaceId, instruction: 'Tạo trang Kế hoạch Q4' }],
    [
      `ai-assistant/conversations/${conversationId}/messages`,
      { content: 'Tạo trang Kế hoạch Q4', capability: 'page.compose' },
    ],
    [
      'ai-assistant/pages/modification-plan/from-instruction',
      {
        workspaceId,
        instruction: 'Thêm to-do "Gọi khách" vào trang Release 2.0',
      },
    ],
  ])(
    'POST %s answers 429 AI_DAILY_LIMIT_REACHED without calling the AI service',
    async (path, body) => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/${path}`)
        .auth(token, { type: 'bearer' })
        .send(body)
        .expect(429);

      expect(response.body).toMatchObject({
        statusCode: 429,
        code: AI_DAILY_LIMIT_REACHED,
      });
      expect(countByUser).toHaveBeenCalledWith(
        'authenticated-actor',
        expect.objectContaining({ provider: 'gemini' }),
      );
      expect(runtime.execute).not.toHaveBeenCalled();
      expect(unitOfWork.runInTransaction).not.toHaveBeenCalled();
    },
  );
});
