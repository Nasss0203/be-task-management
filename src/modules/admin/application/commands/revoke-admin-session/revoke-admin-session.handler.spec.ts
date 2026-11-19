import { ConflictException, NotFoundException } from '@nestjs/common';

import type { AdminSessionWriter } from '../../ports/admin-session-writer.port';
import {
  RevokeAdminSessionCommand,
  RevokeAdminUserSessionsCommand,
} from './revoke-admin-session.command';
import {
  RevokeAdminSessionHandler,
  RevokeAdminUserSessionsHandler,
} from './revoke-admin-session.handler';

const client = { ipAddress: '::1', userAgent: 'Chrome' };

function createWriter() {
  const revokeSession = jest.fn();
  const revokeUserSessions = jest.fn();
  const writer: AdminSessionWriter = { revokeSession, revokeUserSessions };

  return { writer, revokeSession, revokeUserSessions };
}

describe('RevokeAdminSessionHandler', () => {
  it('passes the actor and client to the writer and returns the session', async () => {
    const { writer, revokeSession } = createWriter();
    const session = {
      id: 'session-1',
      userId: 'user-1',
      revokedAt: new Date(),
    };
    revokeSession.mockResolvedValue({ kind: 'DONE', session });

    await expect(
      new RevokeAdminSessionHandler(writer).execute(
        new RevokeAdminSessionCommand('admin-1', 'session-1', client),
      ),
    ).resolves.toBe(session);
    expect(revokeSession).toHaveBeenCalledWith({
      sessionId: 'session-1',
      actor: { userId: 'admin-1', ...client },
    });
  });

  it('maps NOT_FOUND to 404', async () => {
    const { writer, revokeSession } = createWriter();
    revokeSession.mockResolvedValue({ kind: 'NOT_FOUND' });

    await expect(
      new RevokeAdminSessionHandler(writer).execute(
        new RevokeAdminSessionCommand('admin-1', 'missing'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('maps UNCHANGED to 409', async () => {
    const { writer, revokeSession } = createWriter();
    revokeSession.mockResolvedValue({ kind: 'UNCHANGED' });

    await expect(
      new RevokeAdminSessionHandler(writer).execute(
        new RevokeAdminSessionCommand('admin-1', 'session-1'),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('RevokeAdminUserSessionsHandler', () => {
  it('returns the revoked count', async () => {
    const { writer, revokeUserSessions } = createWriter();
    revokeUserSessions.mockResolvedValue({ userId: 'user-1', revoked: 3 });

    await expect(
      new RevokeAdminUserSessionsHandler(writer).execute(
        new RevokeAdminUserSessionsCommand('admin-1', 'user-1', client),
      ),
    ).resolves.toEqual({ userId: 'user-1', revoked: 3 });
    expect(revokeUserSessions).toHaveBeenCalledWith({
      userId: 'user-1',
      actor: { userId: 'admin-1', ...client },
    });
  });

  it('maps a missing user to 404', async () => {
    const { writer, revokeUserSessions } = createWriter();
    revokeUserSessions.mockResolvedValue(null);

    await expect(
      new RevokeAdminUserSessionsHandler(writer).execute(
        new RevokeAdminUserSessionsCommand('admin-1', 'missing'),
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
