import {
  ValidationPipe,
  VersioningType,
  ForbiddenException,
} from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Server } from 'node:http';
import { JwtStrategy } from 'src/common/strategy/jwt.strategy';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import request from 'supertest';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { RATE_LIMIT_MESSAGE_METADATA } from 'src/common/decorator/rate-limit.decorator';
import { TransformInterceptor } from 'src/common/interceptor/transform.interceptor';
import { AiAskService } from '../../../application/services/ai-ask.service';
import { AiAssistantController } from './ai-assistant.controller';

// Isolated credentials/user repository; production JWT strategy and guard run.
const secret = 'ask-http-test-only-secret';

describe('POST /api/v1/ai-assistant/ask', () => {
  let app: INestApplication<Server>;
  let token: string;
  const ask = jest.fn<
    ReturnType<AiAskService['ask']>,
    Parameters<AiAskService['ask']>
  >();
  const valid = {
    workspaceId: '550e8400-e29b-41d4-a716-446655440000',
    instruction: 'Tạo trang Q4',
  };
  beforeAll(async () => {
    const dependencies = Reflect.getMetadata(
      'design:paramtypes',
      AiAssistantController,
    ) as Array<new (...args: never[]) => unknown>;
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
          useValue: provide === AiAskService ? { ask } : {},
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
    await app.init();
    token = module.get(JwtService).sign({ sub: 'authenticated-actor' });
  });
  afterAll(async () => {
    await app?.close();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    ask.mockReset();
    ask.mockResolvedValue({
      status: 'UNSUPPORTED_REQUEST',
      intent: 'OTHER',
      capability: null,
      assistantMessage: 'Chưa hỗ trợ',
      requestId: 'r',
      reason: 'M0',
    });
  });
  it.each([undefined, 'invalid-token'])(
    'requires valid authentication (%s)',
    async (credential) => {
      const req = request(app.getHttpServer()).post('/api/v1/ai-assistant/ask');
      if (credential) req.set('Authorization', `Bearer ${credential}`);
      await req.send(valid).expect(401);
      expect(ask).not.toHaveBeenCalled();
    },
  );
  it('uses JWT identity, forwards explicit share token and returns standard envelope', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/ai-assistant/ask?shareToken=explicit-share')
      .auth(token, { type: 'bearer' })
      .send(valid)
      .expect(201);
    expect(response.body).toMatchObject({
      statusCode: 201,
      data: { status: 'UNSUPPORTED_REQUEST', intent: 'OTHER' },
    });
    expect(ask).toHaveBeenCalledWith(
      expect.objectContaining({
        ...valid,
        userId: 'authenticated-actor',
        shareToken: 'explicit-share',
        requestId: expect.stringMatching(/^[a-f0-9-]{36}$/u) as string,
      }),
    );
  });
  it('does not invent share privileges when no token is provided', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/ai-assistant/ask')
      .auth(token, { type: 'bearer' })
      .send(valid)
      .expect(201);
    expect(ask.mock.calls[0][0].shareToken).toBeUndefined();
  });
  it.each([
    { userId: 'attacker' },
    { capability: 'writing.translate' },
    { instruction: '   ' },
    { instruction: 'x'.repeat(4001) },
    { selectedText: '' },
    { selectedText: 'x'.repeat(8001) },
    { workspaceId: 'bad' },
    { currentPageId: 'bad' },
    { selectedPageId: 'bad' },
    { conversationId: 'bad' },
    { requestId: 'bad' },
  ])('rejects invalid DTO or bypass field %#', async (patch) => {
    await request(app.getHttpServer())
      .post('/api/v1/ai-assistant/ask')
      .auth(token, { type: 'bearer' })
      .send({ ...valid, ...patch })
      .expect(400);
    expect(ask).not.toHaveBeenCalled();
  });
  it('accepts optional null context fields', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/ai-assistant/ask')
      .auth(token, { type: 'bearer' })
      .send({
        ...valid,
        selectedText: null,
        currentPageId: null,
        selectedPageId: null,
        conversationId: null,
        requestId: null,
      })
      .expect(201);
  });
  it('returns conversationSwitched when the server opened a new conversation', async () => {
    ask.mockResolvedValue({
      status: 'GENERATION_CREATED',
      intent: 'CREATE_PAGE',
      capability: 'GENERATE_PAGE_COMPOSITION',
      conversationId: 'new-conversation',
      conversationSwitched: true,
      generationId: 'generation',
      generation: {} as never,
      assistantMessage: 'Bản nháp đã sẵn sàng để xem trước.',
      requestId: 'r',
    });
    const response = await request(app.getHttpServer())
      .post('/api/v1/ai-assistant/ask')
      .auth(token, { type: 'bearer' })
      .send({
        ...valid,
        conversationId: '550e8400-e29b-41d4-a716-446655440001',
      })
      .expect(201);
    expect(response.body).toMatchObject({
      data: { conversationId: 'new-conversation', conversationSwitched: true },
    });
  });
  it('propagates application authorization errors', async () => {
    ask.mockRejectedValue(new ForbiddenException('Workspace access denied'));
    await request(app.getHttpServer())
      .post('/api/v1/ai-assistant/ask')
      .auth(token, { type: 'bearer' })
      .send(valid)
      .expect(403);
  });
  it('has the existing write rate limit decorator', () => {
    const handler = Reflect.getOwnPropertyDescriptor(
      AiAssistantController.prototype,
      'ask',
    )?.value as unknown;
    expect(
      Reflect.getMetadata(RATE_LIMIT_MESSAGE_METADATA, handler as object),
    ).toContain('Too many changes');
    expect(
      Reflect.getMetadata('THROTTLER:LIMITdefault', handler as object),
    ).toBe(80);
  });
});
