import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from 'src/common/guard/jwt-auth.guard';
import { TransformInterceptor } from 'src/common/interceptor/transform.interceptor';
import { JwtStrategy } from 'src/common/strategy/jwt.strategy';
import { IDENTITY_TYPES } from 'src/modules/identity/identity.types';
import { GetMyClaimedTemplatesHandler } from '../../../application/queries/template-entitlement/get-my-claimed-templates/get-my-claimed-templates.handler';
import { TEMPLATE_TYPES } from '../../../template.types';
import { MyClaimedTemplatesController } from './my-claimed-templates.controller';
import { TemplateController } from './template.controller';

describe('MyClaimedTemplatesController HTTP contract', () => {
  let app: INestApplication;
  const secret = 'step5a-test-secret';
  const jwt = new JwtService({ secret });
  const findClaimedByUser = jest
    .fn()
    .mockResolvedValue({ items: [], hasNextPage: false });
  const detailExecute = jest.fn();
  const url = '/api/v1/templates/me/claimed';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      // Register the existing parameterized controller first to verify routing.
      controllers: [TemplateController, MyClaimedTemplatesController],
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: { get: () => secret } },
        {
          provide: IDENTITY_TYPES.repositories.UserRepository,
          useValue: {
            findProfileById: jest.fn(async (id: string) => ({
              id,
              isActive: true,
              email: 'test@example.com',
              username: 'test',
              systemRole: 'USER',
            })),
          },
        },
        {
          provide: TEMPLATE_TYPES.repositories.TemplateEntitlementRepository,
          useValue: { findClaimedByUser },
        },
        {
          provide: TEMPLATE_TYPES.applications.GetMyClaimedTemplatesHandler,
          useClass: GetMyClaimedTemplatesHandler,
        },
        ...Object.entries(TEMPLATE_TYPES.applications)
          .filter(([name]) => name !== 'GetMyClaimedTemplatesHandler')
          .map(([, token]) => ({
            provide: token,
            useValue: { execute: detailExecute },
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
    app.useGlobalGuards(new JwtAuthGuard(app.get(Reflector)));
    app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));
    await app.init();
  });
  beforeEach(() => {
    findClaimedByUser.mockClear();
    detailExecute.mockClear();
  });
  afterAll(async () => {
    await app?.close();
  });

  it.each([
    undefined,
    'invalid-token',
    jwt.sign({ id: 'user-a' }, { expiresIn: -1 }),
  ])('requires a valid JWT (%s)', async (token) => {
    const call = request(app.getHttpServer()).get(url);
    if (token) call.set('Authorization', 'Bearer ' + token);
    await call.expect(401);
    expect(findClaimedByUser).not.toHaveBeenCalled();
  });

  it.each(['user-a', 'user-b'])(
    'uses JWT identity %s and existing response envelope without route conflict',
    async (id) => {
      const response = await request(app.getHttpServer())
        .get(url + '?limit=2')
        .set('Authorization', 'Bearer ' + jwt.sign({ id }))
        .expect(200);
      expect(response.body).toEqual({
        statusCode: 200,
        message: 'Claimed templates retrieved successfully',
        data: { items: [], nextCursor: null },
      });
      expect(findClaimedByUser).toHaveBeenCalledWith({
        userId: id,
        limit: 2,
        cursor: undefined,
      });
      expect(detailExecute).not.toHaveBeenCalled();
    },
  );

  it.each([
    'userId=user-b',
    'user_id=user-b',
    'limit=101',
    'limit=0',
    'limit=1.5',
    'limit=abc',
    'cursor=bad',
  ])('rejects unsupported or malformed query %s', async (query) => {
    await request(app.getHttpServer())
      .get(url + '?' + query)
      .set('Authorization', 'Bearer ' + jwt.sign({ id: 'user-a' }))
      .expect(400);
    expect(findClaimedByUser).not.toHaveBeenCalled();
  });
});
