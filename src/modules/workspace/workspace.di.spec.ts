import { type Provider } from '@nestjs/common';
import {
  MODULE_METADATA,
  SELF_DECLARED_DEPS_METADATA,
} from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TeamspaceModule } from 'src/modules/teamspace/teamspace.module';
import { CreateDefaultWorkspaceHandler } from './application/commands/workspace/create-default-workspace/create-default-workspace.handler';
import { WorkspaceModule } from './workspace.module';
import { WORKSPACE_TYPES } from './workspace.types';

describe('Workspace application DI', () => {
  it('compiles WorkspaceModule and TeamspaceModule with an inert data source', async () => {
    const repository = {};
    const dataSource = {
      options: { type: 'postgres' },
      entityMetadatas: [],
      getRepository: () => repository,
      manager: { getRepository: () => repository },
    };
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        EventEmitterModule.forRoot(),
        WorkspaceModule,
        TeamspaceModule,
      ],
    })
      .overrideProvider(getDataSourceToken())
      .useValue(dataSource)
      .compile();

    expect(module.get(WorkspaceModule)).toBeDefined();
    expect(module.get(TeamspaceModule)).toBeDefined();
    for (const token of Object.values(WORKSPACE_TYPES.applications)) {
      expect(
        module.select(WorkspaceModule).get(token, { strict: true }),
      ).toBeDefined();
    }
    expect(
      module
        .select(WorkspaceModule)
        .get(CreateDefaultWorkspaceHandler, { strict: true }),
    ).toBe(
      module
        .select(WorkspaceModule)
        .get(WORKSPACE_TYPES.applications.CreateDefaultWorkspaceHandler, {
          strict: true,
        }),
    );
    await module.close();
  });

  it('provides every handler once by Symbol and keeps only the required class alias', async () => {
    const tokens = Object.values(WORKSPACE_TYPES.applications);
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      WorkspaceModule,
    ) as Provider[];
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      WorkspaceModule,
    ) as Array<new (...args: unknown[]) => unknown>;
    const applications = providers.filter(
      (
        provider,
      ): provider is { provide: symbol; useClass: new () => unknown } =>
        typeof provider === 'object' &&
        provider !== null &&
        'provide' in provider &&
        'useClass' in provider &&
        tokens.includes(provider.provide as symbol),
    );

    expect(applications).toHaveLength(tokens.length);
    for (const application of applications) {
      expect(
        providers.filter((provider) => provider === application.useClass),
      ).toHaveLength(0);
      expect(
        applications.filter(
          (candidate) => candidate.provide === application.provide,
        ),
      ).toHaveLength(1);
    }
    expect(
      providers.filter(
        (provider) =>
          typeof provider === 'object' &&
          provider !== null &&
          'provide' in provider &&
          provider.provide === CreateDefaultWorkspaceHandler &&
          'useExisting' in provider,
      ),
    ).toHaveLength(1);

    const declaredTokens = controllers.flatMap((controller) => {
      const dependencies = Reflect.getMetadata(
        SELF_DECLARED_DEPS_METADATA,
        controller,
      ) as Array<{ index: number; param: symbol }>;
      return dependencies.map(({ param }) => param);
    });
    const controllerTokens = tokens.filter(
      (token) =>
        token !== WORKSPACE_TYPES.applications.CreateDefaultWorkspaceHandler,
    );
    expect(declaredTokens).toHaveLength(controllerTokens.length);
    expect(new Set(declaredTokens)).toEqual(new Set(controllerTokens));

    const module = await Test.createTestingModule({
      controllers,
      providers: [
        ...controllerTokens.map((provide) => ({
          provide,
          useValue: { execute: jest.fn() },
        })),
      ],
    }).compile();

    for (const controller of controllers) {
      expect(module.get(controller)).toBeDefined();
    }
    for (const token of controllerTokens) {
      expect(module.get(token)).toBeDefined();
    }
  });
});
