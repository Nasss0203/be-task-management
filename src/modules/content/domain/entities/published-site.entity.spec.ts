import {
  PublishedSite,
  PublishedSiteDisabledByAdminError,
} from './published-site.entity';

function restoreSite(moderated: boolean): PublishedSite {
  const disabledAt = new Date('2026-11-19T06:00:00.000Z');

  return PublishedSite.restore({
    id: 'site-1',
    workspaceId: 'workspace-1',
    rootPageId: 'page-1',
    subdomain: 'home',
    createdBy: 'user-1',
    createdAt: disabledAt,
    updatedAt: disabledAt,
    disabledAt,
    moderation: moderated
      ? { disabledAt, disabledBy: 'admin-1', reason: 'Spam' }
      : null,
  });
}

describe('PublishedSite', () => {
  it('re-enables a site the owner disabled', () => {
    const site = restoreSite(false);

    site.enable();

    expect(site.getDisabledAt()).toBeNull();
    expect(site.isDisabledByAdmin()).toBe(false);
  });

  it('refuses to re-enable a site disabled by an administrator', () => {
    const site = restoreSite(true);

    expect(() => site.enable()).toThrow(PublishedSiteDisabledByAdminError);
    expect(site.getDisabledAt()).not.toBeNull();
  });
});
