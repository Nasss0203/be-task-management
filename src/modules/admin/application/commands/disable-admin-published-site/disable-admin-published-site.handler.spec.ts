import { ConflictException, NotFoundException } from '@nestjs/common';

import type { AdminPublishedSiteWriter } from '../../ports/admin-published-site-writer.port';
import { RestoreAdminPublishedSiteCommand } from '../restore-admin-published-site/restore-admin-published-site.command';
import { RestoreAdminPublishedSiteHandler } from '../restore-admin-published-site/restore-admin-published-site.handler';
import { DisableAdminPublishedSiteCommand } from './disable-admin-published-site.command';
import { DisableAdminPublishedSiteHandler } from './disable-admin-published-site.handler';

function createWriter(): jest.Mocked<AdminPublishedSiteWriter> {
  return { disableSite: jest.fn(), restoreSite: jest.fn() };
}

const client = { ipAddress: '::1', userAgent: 'Chrome' };

describe('admin published site moderation handlers', () => {
  it('passes the actor, client and reason to the writer', async () => {
    const disableSite = jest.fn();
    const writer = { ...createWriter(), disableSite };
    const site = { id: 'site-1', disabledAt: new Date(), moderation: null };
    disableSite.mockResolvedValue({ kind: 'DONE', site });

    await expect(
      new DisableAdminPublishedSiteHandler(writer).execute(
        new DisableAdminPublishedSiteCommand(
          'admin-1',
          'site-1',
          'Spam',
          client,
        ),
      ),
    ).resolves.toBe(site);
    expect(disableSite).toHaveBeenCalledWith({
      siteId: 'site-1',
      reason: 'Spam',
      actor: { userId: 'admin-1', ...client },
    });
  });

  it('maps a missing site to 404 and a repeated takedown to 409', async () => {
    const writer = createWriter();
    const handler = new DisableAdminPublishedSiteHandler(writer);
    const command = new DisableAdminPublishedSiteCommand(
      'admin-1',
      'site-1',
      'Spam',
    );

    writer.disableSite.mockResolvedValueOnce({ kind: 'NOT_FOUND' });
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    writer.disableSite.mockResolvedValueOnce({ kind: 'UNCHANGED' });
    await expect(handler.execute(command)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('rejects restoring a site that is not taken down', async () => {
    const writer = createWriter();
    writer.restoreSite.mockResolvedValue({ kind: 'UNCHANGED' });

    await expect(
      new RestoreAdminPublishedSiteHandler(writer).execute(
        new RestoreAdminPublishedSiteCommand('admin-1', 'site-1'),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
