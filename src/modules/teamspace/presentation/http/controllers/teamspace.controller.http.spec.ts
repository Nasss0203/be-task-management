import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { TeamspaceMember } from 'src/modules/teamspace/domain/entities/teamspace-member.entity';
import { TEAMSPACE_TYPES } from 'src/modules/teamspace/teamspace.types';
import { TeamspaceController } from './teamspace.controller';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const TEAMSPACE_ID = '22222222-2222-4222-8222-222222222222';
const INVITATION_ID = '33333333-3333-4333-8333-333333333333';
const LINK_ID = '44444444-4444-4444-8444-444444444444';
const WORKSPACE_ID = '55555555-5555-4555-8555-555555555555';
const TOKEN = 'a'.repeat(43);

class FakeJwtGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    context.switchToHttp().getRequest<{ user?: { id: string } }>().user = {
      id: USER_ID,
    };
    return true;
  }
}

type HandlerName = keyof typeof TEAMSPACE_TYPES.applications;

/**
 * Covers the routes the frontend uses for invitations, members, invite links
 * and open join: routing (static vs :param segments), validation and that the
 * caller id always comes from the token.
 */
describe('TeamspaceController (HTTP, frontend contract)', () => {
  let app: INestApplication;

  const handlers = Object.fromEntries(
    Object.keys(TEAMSPACE_TYPES.applications).map((name) => [
      name,
      { execute: jest.fn() },
    ]),
  ) as Record<HandlerName, { execute: jest.Mock }>;

  const member = () =>
    TeamspaceMember.create({
      teamspaceId: TEAMSPACE_ID,
      workspaceMemberId: USER_ID,
    });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TeamspaceController],
      providers: [
        ...Object.entries(TEAMSPACE_TYPES.applications).map(
          ([name, token]) => ({
            provide: token,
            useValue: handlers[name as HandlerName],
          }),
        ),
        { provide: APP_GUARD, useClass: FakeJwtGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  const http = () => request(app.getHttpServer());

  describe('invitations of the current user', () => {
    it('routes GET invitations/me to the caller list, not to :teamspaceId/invitations', async () => {
      handlers.GetMyTeamspaceInvitationsHandler.execute.mockResolvedValue([]);

      await http().get('/teamspaces/invitations/me').expect(200);

      expect(
        handlers.GetMyTeamspaceInvitationsHandler.execute,
      ).toHaveBeenCalledWith(expect.objectContaining({ userId: USER_ID }));
      expect(
        handlers.ListTeamspaceInvitationsHandler.execute,
      ).not.toHaveBeenCalled();
    });

    it.each(['accept', 'decline'] as const)(
      '%s uses the caller id',
      async (action) => {
        const handler =
          action === 'accept'
            ? handlers.AcceptTeamspaceInvitationHandler
            : handlers.DeclineTeamspaceInvitationHandler;
        handler.execute.mockResolvedValue({ id: INVITATION_ID });

        await http()
          .post(`/teamspaces/invitations/${INVITATION_ID}/${action}`)
          .expect(201);

        expect(handler.execute).toHaveBeenCalledWith(
          expect.objectContaining({
            invitationId: INVITATION_ID,
            userId: USER_ID,
          }),
        );
      },
    );

    it('rejects a non-UUID invitation id', async () => {
      await http().post('/teamspaces/invitations/nope/accept').expect(400);
      expect(
        handlers.AcceptTeamspaceInvitationHandler.execute,
      ).not.toHaveBeenCalled();
    });
  });

  describe('member management', () => {
    it('lists pending invitations of a teamspace with parsed paging', async () => {
      handlers.ListTeamspaceInvitationsHandler.execute.mockResolvedValue({
        items: [],
      });

      await http()
        .get(`/teamspaces/${TEAMSPACE_ID}/invitations`)
        .query({ status: 'PENDING', limit: '100' })
        .expect(200);

      expect(
        handlers.ListTeamspaceInvitationsHandler.execute,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          teamspaceId: TEAMSPACE_ID,
          status: 'PENDING',
          limit: 100,
        }),
      );
    });

    it('rejects an unknown invitation status filter', async () => {
      await http()
        .get(`/teamspaces/${TEAMSPACE_ID}/invitations`)
        .query({ status: 'WHATEVER' })
        .expect(400);
    });

    it('invites by workspace member id and rejects anything else', async () => {
      handlers.InviteTeamspaceMemberHandler.execute.mockResolvedValue({
        id: INVITATION_ID,
      });

      await http()
        .post(`/teamspaces/${TEAMSPACE_ID}/invitations`)
        .send({ workspace_member_id: WORKSPACE_ID })
        .expect(201);
      await http()
        .post(`/teamspaces/${TEAMSPACE_ID}/invitations`)
        .send({ workspace_member_id: 'not-a-uuid' })
        .expect(400);

      expect(
        handlers.InviteTeamspaceMemberHandler.execute,
      ).toHaveBeenCalledTimes(1);
    });

    it('rejects an unknown role', async () => {
      await http()
        .patch(`/teamspaces/${TEAMSPACE_ID}/members/${INVITATION_ID}/role`)
        .send({ role_name: 'ADMIN' })
        .expect(400);
      expect(
        handlers.UpdateTeamspaceMemberRoleHandler.execute,
      ).not.toHaveBeenCalled();
    });

    it('revokes and leaves with 204', async () => {
      await http()
        .post(`/teamspaces/invitations/${INVITATION_ID}/revoke`)
        .expect(204);
      await http().post(`/teamspaces/${TEAMSPACE_ID}/leave`).expect(204);
      await http()
        .delete(`/teamspaces/${TEAMSPACE_ID}/members/${INVITATION_ID}`)
        .expect(204);
    });
  });

  describe('invite links', () => {
    it('creates a link with bounded max uses', async () => {
      handlers.CreateTeamspaceInviteLinkHandler.execute.mockResolvedValue({
        id: LINK_ID,
      });

      await http()
        .post(`/teamspaces/${TEAMSPACE_ID}/invite-links`)
        .send({ max_uses: 5, expires_at: '2026-11-01T00:00:00.000Z' })
        .expect(201);
      for (const max_uses of [0, 101, 2.5]) {
        await http()
          .post(`/teamspaces/${TEAMSPACE_ID}/invite-links`)
          .send({ max_uses })
          .expect(400);
      }

      expect(
        handlers.CreateTeamspaceInviteLinkHandler.execute,
      ).toHaveBeenCalledTimes(1);
    });

    it('revokes a link with 204', async () => {
      await http()
        .delete(`/teamspaces/${TEAMSPACE_ID}/invite-links/${LINK_ID}`)
        .expect(204);
      expect(
        handlers.RevokeTeamspaceInviteLinkHandler.execute,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ teamspaceId: TEAMSPACE_ID, linkId: LINK_ID }),
      );
    });

    it('joins by link only with a well-formed token', async () => {
      handlers.JoinTeamspaceByLinkHandler.execute.mockResolvedValue(member());

      await http()
        .post('/teamspaces/join-by-link')
        .send({ token: TOKEN })
        .expect(201);
      await http()
        .post('/teamspaces/join-by-link')
        .send({ token: 'short' })
        .expect(400);

      expect(handlers.JoinTeamspaceByLinkHandler.execute).toHaveBeenCalledTimes(
        1,
      );
      expect(handlers.JoinTeamspaceByLinkHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({ token: TOKEN, userId: USER_ID }),
      );
    });
  });

  describe('open join', () => {
    it('discovers open teamspaces of a workspace', async () => {
      handlers.DiscoverTeamspacesHandler.execute.mockResolvedValue({
        items: [],
      });

      await http()
        .get('/teamspaces/discover')
        .query({ workspaceId: WORKSPACE_ID })
        .expect(200);
      await http()
        .get('/teamspaces/discover')
        .query({ workspaceId: 'nope' })
        .expect(400);

      expect(handlers.DiscoverTeamspacesHandler.execute).toHaveBeenCalledTimes(
        1,
      );
    });

    it('joins a teamspace as the caller', async () => {
      handlers.JoinTeamspaceHandler.execute.mockResolvedValue(member());

      await http().post(`/teamspaces/${TEAMSPACE_ID}/join`).expect(201);

      expect(handlers.JoinTeamspaceHandler.execute).toHaveBeenCalledWith(
        expect.objectContaining({ teamspaceId: TEAMSPACE_ID, userId: USER_ID }),
      );
    });

    it('accepts only OPEN or PRIVATE visibility', async () => {
      handlers.UpdateTeamspaceJoinSettingsHandler.execute.mockResolvedValue({});

      await http()
        .patch(`/teamspaces/${TEAMSPACE_ID}/join-settings`)
        .send({ visibility: 'PRIVATE' })
        .expect(200);
      await http()
        .patch(`/teamspaces/${TEAMSPACE_ID}/join-settings`)
        .send({ visibility: 'SECRET' })
        .expect(400);

      expect(
        handlers.UpdateTeamspaceJoinSettingsHandler.execute,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
