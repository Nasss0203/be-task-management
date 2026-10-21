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
    for (const featureModule of [WorkspaceModule, TeamspaceModule]) {
      const feature = module.select(featureModule);
      const providers = Reflect.getMetadata(
        MODULE_METADATA.PROVIDERS,
        featureModule,
      ) as Provider[];
      for (const provider of providers) {
        if (
          typeof provider === 'object' &&
          provider !== null &&
          'provide' in provider &&
          'useExisting' in provider
        ) {
          expect(feature.get(provider.provide, { strict: true })).toBe(
            feature.get(provider.useExisting, { strict: true }),
          );
        }
      }
    }
    await module.close();
  });

  it('aliases every controller token to its one class provider', async () => {
    const tokens = Object.values(WORKSPACE_TYPES.applications);
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      WorkspaceModule,
    ) as Provider[];
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      WorkspaceModule,
    ) as Array<new (...args: unknown[]) => unknown>;
    const aliases = providers.filter(
      (provider): provider is { provide: symbol; useExisting: new () => unknown } =>
        typeof provider === 'object' &&
        provider !== null &&
        'provide' in provider &&
        'useExisting' in provider &&
        tokens.includes(provider.provide as symbol),
    );

    expect(aliases).toHaveLength(tokens.length);
    for (const alias of aliases) {
      expect(providers.filter((provider) => provider === alias.useExisting)).toHaveLength(1);
      expect(aliases.filter((candidate) => candidate.provide === alias.provide)).toHaveLength(1);
    }

    const declaredTokens = controllers.flatMap((controller) => {
      const dependencies = Reflect.getMetadata(
        SELF_DECLARED_DEPS_METADATA,
        controller,
      ) as Array<{ index: number; param: symbol }>;
      return dependencies.map(({ param }) => param);
    });
    expect(declaredTokens).toHaveLength(tokens.length);
    expect(new Set(declaredTokens)).toEqual(new Set(tokens));

    const module = await Test.createTestingModule({
      controllers,
      providers: [
        ...aliases.map(({ useExisting }) => ({
          provide: useExisting,
          useValue: { execute: jest.fn() },
        })),
        ...aliases,
      ],
    }).compile();

    for (const controller of controllers) {
      expect(module.get(controller)).toBeDefined();
    }
    for (const alias of aliases) {
      expect(module.get(alias.provide)).toBe(module.get(alias.useExisting));
    }
  });
});
