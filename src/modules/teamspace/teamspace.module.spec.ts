import { type Provider } from '@nestjs/common';
import {
  MODULE_METADATA,
  SELF_DECLARED_DEPS_METADATA,
} from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DATABASE_ENTITIES } from 'src/database/entities';
import { AuthorizationService } from 'src/modules/permission/application/services/authorization.service';
import { WorkspaceModule } from 'src/modules/workspace/workspace.module';
import { WORKSPACE_TYPES } from 'src/modules/workspace/workspace.types';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { AddTeamspaceMemberHandler } from './application/commands/teamspace/add-teamspace-member/add-teamspace-member.handler';
import { CreateTeamspaceHandler } from './application/commands/teamspace/create-teamspace/create-teamspace.handler';
import { UpdateTeamspaceMemberRoleHandler } from './application/commands/teamspace/update-teamspace-member-role/update-teamspace-member-role.handler';
import { GetTeamspaceMembersHandler } from './application/queries/teamspace/get-teamspace-members/get-teamspace-members.handler';
import { GetTeamspacesHandler } from './application/queries/teamspace/get-teamspaces/get-teamspaces.handler';
import { TeamspaceMemberOrmEntity } from './infrastructure/persistence/typeorm/entities/teamspace-member.orm-entity';
import { TeamspaceOrmEntity } from './infrastructure/persistence/typeorm/entities/teamspace.orm-entity';
import { TypeOrmTeamspaceMembershipLock } from './infrastructure/persistence/typeorm/adapters/typeorm-teamspace-membership-lock.adapter';
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
    expect(
      DATABASE_ENTITIES.filter((entity) => entity === TeamspaceOrmEntity),
    ).toHaveLength(1);
    expect(
      DATABASE_ENTITIES.filter((entity) => entity === TeamspaceMemberOrmEntity),
    ).toHaveLength(1);
  });

  it('resolves all five handlers through their DI contracts', async () => {
    const module = await Test.createTestingModule({
      providers: [
        {
          provide: TEAMSPACE_TYPES.applications.CreateTeamspaceHandler,
          useClass: CreateTeamspaceHandler,
        },
        {
          provide: TEAMSPACE_TYPES.applications.AddTeamspaceMemberHandler,
          useClass: AddTeamspaceMemberHandler,
        },
        {
          provide:
            TEAMSPACE_TYPES.applications.UpdateTeamspaceMemberRoleHandler,
          useClass: UpdateTeamspaceMemberRoleHandler,
        },
        {
          provide: TEAMSPACE_TYPES.applications.GetTeamspacesHandler,
          useClass: GetTeamspacesHandler,
        },
        {
          provide: TEAMSPACE_TYPES.applications.GetTeamspaceMembersHandler,
          useClass: GetTeamspaceMembersHandler,
        },
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
        {
          provide: TEAMSPACE_TYPES.ports.TeamspaceMembershipLock,
          useValue: { lockForMembershipChange: jest.fn() },
        },
      ],
    }).compile();

    for (const token of Object.values(TEAMSPACE_TYPES.applications)) {
      expect(module.get(token)).toBeDefined();
    }
  });

  it('uses one Symbol provider per handler and injects controller tokens', async () => {
    const tokens = Object.values(TEAMSPACE_TYPES.applications);
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      TeamspaceModule,
    ) as Provider[];
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
    const dependencies = Reflect.getMetadata(
      SELF_DECLARED_DEPS_METADATA,
      TeamspaceController,
    ) as Array<{ index: number; param: symbol }>;

    expect(applications).toHaveLength(5);
    expect(applications.map(({ useClass }) => useClass)).toEqual([
      CreateTeamspaceHandler,
      AddTeamspaceMemberHandler,
      UpdateTeamspaceMemberRoleHandler,
      GetTeamspacesHandler,
      GetTeamspaceMembersHandler,
    ]);
    expect(
      [...dependencies]
        .sort((left, right) => left.index - right.index)
        .map(({ param }) => param),
    ).toEqual([
      TEAMSPACE_TYPES.applications.CreateTeamspaceHandler,
      TEAMSPACE_TYPES.applications.GetTeamspacesHandler,
      TEAMSPACE_TYPES.applications.AddTeamspaceMemberHandler,
      TEAMSPACE_TYPES.applications.GetTeamspaceMembersHandler,
      TEAMSPACE_TYPES.applications.UpdateTeamspaceMemberRoleHandler,
    ]);
    for (const application of applications) {
      expect(
        providers.filter((provider) => provider === application.useClass),
      ).toHaveLength(0);
      expect(
        applications.filter(
          (provider) => provider.provide === application.provide,
        ),
      ).toHaveLength(1);
    }

    const module = await Test.createTestingModule({
      controllers: [TeamspaceController],
      providers: [
        ...applications.map(({ provide }) => ({
          provide,
          useValue: { execute: jest.fn() },
        })),
      ],
    }).compile();

    expect(module.get(TeamspaceController)).toBeDefined();
    for (const application of applications) {
      expect(module.get(application.provide)).toBeDefined();
    }
  });

  it('resolves the real lock adapter, handlers, and controller', async () => {
    const providers = Reflect.getMetadata(
      MODULE_METADATA.PROVIDERS,
      TeamspaceModule,
    ) as Provider[];
    const module = await Test.createTestingModule({
      controllers: [TeamspaceController],
      providers: [
        ...providers,
        { provide: getRepositoryToken(TeamspaceOrmEntity), useValue: {} },
        { provide: getRepositoryToken(TeamspaceMemberOrmEntity), useValue: {} },
        {
          provide: WORKSPACE_TYPES.repositories.WorkspaceMemberRepository,
          useValue: {},
        },
        { provide: PERSISTENCE_TYPES.UnitOfWork, useValue: {} },
        { provide: AuthorizationService, useValue: {} },
      ],
    }).compile();

    expect(
      module.get(TEAMSPACE_TYPES.ports.TeamspaceMembershipLock),
    ).toBeInstanceOf(TypeOrmTeamspaceMembershipLock);
    expect(
      module.get(TEAMSPACE_TYPES.repositories.TeamspaceRepository),
    ).toBeDefined();
    expect(
      module.get(TEAMSPACE_TYPES.repositories.TeamspaceMemberRepository),
    ).toBeDefined();
    expect(
      module.get(TEAMSPACE_TYPES.applications.UpdateTeamspaceMemberRoleHandler),
    ).toBeInstanceOf(UpdateTeamspaceMemberRoleHandler);
    expect(module.get(TeamspaceController)).toBeDefined();
  });
});
