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
import { TEAMSPACE_INVITATION_DELIVERY_OUTBOX } from 'src/shared/infrastructure/outbox/teamspace-invitation-delivery.port';
import { PERSISTENCE_TYPES } from 'src/shared/infrastructure/persistence/persistence.types';
import { InviteTeamspaceMemberHandler } from './application/commands/teamspace/invite-teamspace-member/invite-teamspace-member.handler';
import { UpdateTeamspaceMemberRoleHandler } from './application/commands/teamspace/update-teamspace-member-role/update-teamspace-member-role.handler';
import { TeamspaceInvitationOrmEntity } from './infrastructure/persistence/typeorm/entities/teamspace-invitation.orm-entity';
import { TeamspaceInviteLinkOrmEntity } from './infrastructure/persistence/typeorm/entities/teamspace-invite-link.orm-entity';
import { TeamspaceMemberOrmEntity } from './infrastructure/persistence/typeorm/entities/teamspace-member.orm-entity';
import { TeamspaceOrmEntity } from './infrastructure/persistence/typeorm/entities/teamspace.orm-entity';
import { TypeOrmTeamspaceMembershipLock } from './infrastructure/persistence/typeorm/adapters/typeorm-teamspace-membership-lock.adapter';
import { TeamspaceController } from './presentation/http/controllers/teamspace.controller';
import { TeamspaceModule } from './teamspace.module';
import { TEAMSPACE_TYPES } from './teamspace.types';

type ApplicationProvider = {
  provide: symbol;
  useClass: abstract new (...args: never[]) => unknown;
};

const TEAMSPACE_ENTITIES = [
  TeamspaceOrmEntity,
  TeamspaceMemberOrmEntity,
  TeamspaceInvitationOrmEntity,
  TeamspaceInviteLinkOrmEntity,
];

const applicationTokens: symbol[] = Object.values(TEAMSPACE_TYPES.applications);

function moduleProviders(): Provider[] {
  return Reflect.getMetadata(
    MODULE_METADATA.PROVIDERS,
    TeamspaceModule,
  ) as Provider[];
}

// Read from the module itself so new handlers are covered without editing this spec.
function applicationProviders(): ApplicationProvider[] {
  return moduleProviders().filter(
    (provider): provider is ApplicationProvider =>
      typeof provider === 'object' &&
      provider !== null &&
      'provide' in provider &&
      'useClass' in provider &&
      applicationTokens.includes(provider.provide as symbol),
  );
}

/** Dependencies the handlers get from other modules (Workspace, Persistence, Permission, Outbox). */
const externalDependencies: Provider[] = [
  {
    provide: WORKSPACE_TYPES.repositories.WorkspaceMemberRepository,
    useValue: {},
  },
  { provide: PERSISTENCE_TYPES.UnitOfWork, useValue: {} },
  { provide: AuthorizationService, useValue: {} },
  {
    provide: TEAMSPACE_INVITATION_DELIVERY_OUTBOX,
    useValue: { enqueue: jest.fn() },
  },
];

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
    for (const entity of TEAMSPACE_ENTITIES) {
      expect(
        DATABASE_ENTITIES.filter((registered) => registered === entity),
      ).toHaveLength(1);
    }
  });

  it('resolves every handler through its DI contract', async () => {
    const applications = applicationProviders();
    const module = await Test.createTestingModule({
      providers: [
        ...applications,
        ...Object.values(TEAMSPACE_TYPES.repositories).map((token) => ({
          provide: token,
          useValue: {},
        })),
        {
          provide: TEAMSPACE_TYPES.ports.TeamspaceMembershipLock,
          useValue: { lockForMembershipChange: jest.fn() },
        },
        ...externalDependencies,
      ],
    }).compile();

    expect(applications).toHaveLength(applicationTokens.length);
    for (const { provide, useClass } of applications) {
      expect(module.get(provide)).toBeInstanceOf(useClass);
    }
  });

  it('uses one Symbol provider per handler and injects controller tokens', async () => {
    const applications = applicationProviders();
    const providers = moduleProviders();
    const dependencies = Reflect.getMetadata(
      SELF_DECLARED_DEPS_METADATA,
      TeamspaceController,
    ) as Array<{ index: number; param: symbol }>;

    const provided = applications.map(({ provide }) => provide);
    expect(provided).toHaveLength(applicationTokens.length);
    expect(new Set(provided)).toEqual(new Set(applicationTokens));

    for (const { provide, useClass } of applications) {
      // Symbol('CreateTeamspaceHandler') must be wired to CreateTeamspaceHandler.
      expect(useClass.name).toBe(provide.description);
      // Handlers are only reachable through their token, never as a bare class.
      expect(providers).not.toContain(useClass);
    }

    const injected = dependencies.map(({ param }) => param);
    expect(injected).toHaveLength(applicationTokens.length);
    expect(new Set(injected)).toEqual(new Set(applicationTokens));

    const module = await Test.createTestingModule({
      controllers: [TeamspaceController],
      providers: applications.map(({ provide }) => ({
        provide,
        useValue: { execute: jest.fn() },
      })),
    }).compile();

    expect(module.get(TeamspaceController)).toBeDefined();
  });

  it('resolves the real lock adapter, repositories, handlers, and controller', async () => {
    const module = await Test.createTestingModule({
      controllers: [TeamspaceController],
      providers: [
        ...moduleProviders(),
        ...TEAMSPACE_ENTITIES.map((entity) => ({
          provide: getRepositoryToken(entity),
          useValue: {},
        })),
        ...externalDependencies,
      ],
    }).compile();

    expect(
      module.get(TEAMSPACE_TYPES.ports.TeamspaceMembershipLock),
    ).toBeInstanceOf(TypeOrmTeamspaceMembershipLock);
    for (const token of Object.values(TEAMSPACE_TYPES.repositories)) {
      expect(module.get(token)).toBeDefined();
    }
    expect(
      module.get(TEAMSPACE_TYPES.applications.UpdateTeamspaceMemberRoleHandler),
    ).toBeInstanceOf(UpdateTeamspaceMemberRoleHandler);
    expect(
      module.get(TEAMSPACE_TYPES.applications.InviteTeamspaceMemberHandler),
    ).toBeInstanceOf(InviteTeamspaceMemberHandler);
    expect(module.get(TeamspaceController)).toBeDefined();
  });
});
