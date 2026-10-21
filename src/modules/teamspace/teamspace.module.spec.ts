import { type Provider } from '@nestjs/common';
import {
  MODULE_METADATA,
  SELF_DECLARED_DEPS_METADATA,
} from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { DATABASE_ENTITIES } from 'src/database/entities';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { WorkspaceModule } from 'src/modules/workspace/workspace.module';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { AddTeamspaceMemberHandler } from './application/commands/teamspace/add-teamspace-member/add-teamspace-member.handler';
import { CreateTeamspaceHandler } from './application/commands/teamspace/create-teamspace/create-teamspace.handler';
import { GetTeamspaceMembersHandler } from './application/queries/teamspace/get-teamspace-members/get-teamspace-members.handler';
import { GetTeamspacesHandler } from './application/queries/teamspace/get-teamspaces/get-teamspaces.handler';
import { TeamspaceMemberOrmEntity } from './infrastructure/persistence/typeorm/entities/teamspace-member.orm-entity';
import { TeamspaceOrmEntity } from './infrastructure/persistence/typeorm/entities/teamspace.orm-entity';
import { TeamspaceController } from './presentation/http/controllers/teamspace.controller';
import { TeamspaceModule } from './teamspace.module';
import { TEAMSPACE_TYPES } from './teamspace.types';

describe('Teamspace module extraction', () => {
  it('registers the controller once without adding a WorkspaceModule cycle', () => {
    const controllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      TeamspaceModule,
    ) as unknown[];
    const workspaceControllers = Reflect.getMetadata(
      MODULE_METADATA.CONTROLLERS,
      WorkspaceModule,
    ) as unknown[];
    const workspaceImports = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      WorkspaceModule,
    ) as unknown[];

    expect(controllers).toEqual([TeamspaceController]);
    expect(workspaceControllers).not.toContain(TeamspaceController);
    expect(workspaceImports).not.toContain(TeamspaceModule);
    expect(DATABASE_ENTITIES.filter((entity) => entity === TeamspaceOrmEntity)).toHaveLength(1);
    expect(DATABASE_ENTITIES.filter((entity) => entity === TeamspaceMemberOrmEntity)).toHaveLength(1);
  });

  it('resolves all four handlers through their current DI contracts', async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateTeamspaceHandler,
        AddTeamspaceMemberHandler,
        GetTeamspacesHandler,
        GetTeamspaceMembersHandler,
        {
          provide: TEAMSPACE_TYPES.repositories.TeamspaceRepository,
          useValue: {},
        },
        {
          provide: TEAMSPACE_TYPES.repositories.TeamspaceMemberRepository,
          useValue: {},
        },
        {
          provide: WORKSPACE_TYPES.repositories.WorkspaceMemberRepository,
          useValue: {},
        },
        { provide: PERSISTENCE_TYPES.UnitOfWork, useValue: {} },
        { provide: AuthorizationService, useValue: {} },
      ],
    }).compile();

    expect(module.get(CreateTeamspaceHandler)).toBeDefined();
    expect(module.get(AddTeamspaceMemberHandler)).toBeDefined();
    expect(module.get(GetTeamspacesHandler)).toBeDefined();
    expect(module.get(GetTeamspaceMembersHandler)).toBeDefined();
  });

  it('aliases controller tokens to the existing handler instances', async () => {
    const tokens = Object.values(TEAMSPACE_TYPES.applications);
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      TeamspaceModule,
    ) as Provider[];
    const aliases = providers.filter(
      (provider): provider is { provide: symbol; useExisting: new () => unknown } =>
        typeof provider === 'object' &&
        provider !== null &&
        'provide' in provider &&
        'useExisting' in provider &&
        tokens.includes(provider.provide as symbol),
    );
    const dependencies = Reflect.getMetadata(
      SELF_DECLARED_DEPS_METADATA,
      TeamspaceController,
    ) as Array<{ index: number; param: symbol }>;

    expect(aliases).toHaveLength(4);
    expect(
      [...dependencies]
        .sort((left, right) => left.index - right.index)
        .map(({ param }) => param),
    ).toEqual([
      TEAMSPACE_TYPES.applications.CreateTeamspaceHandler,
      TEAMSPACE_TYPES.applications.GetTeamspacesHandler,
      TEAMSPACE_TYPES.applications.AddTeamspaceMemberHandler,
      TEAMSPACE_TYPES.applications.GetTeamspaceMembersHandler,
    ]);
    for (const alias of aliases) {
      expect(providers.filter((provider) => provider === alias.useExisting)).toHaveLength(1);
    }

    const module = await Test.createTestingModule({
      controllers: [TeamspaceController],
      providers: [
        ...aliases.map(({ useExisting }) => ({
          provide: useExisting,
          useValue: { execute: jest.fn() },
        })),
        ...aliases,
      ],
    }).compile();

    expect(module.get(TeamspaceController)).toBeDefined();
    for (const alias of aliases) {
      expect(module.get(alias.provide)).toBe(module.get(alias.useExisting));
    }
  });
});
