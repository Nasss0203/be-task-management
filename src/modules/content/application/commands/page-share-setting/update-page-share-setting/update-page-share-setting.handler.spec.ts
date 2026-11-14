import { BadRequestException } from '@nestjs/common';

import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';
import { TeamspaceVisibility } from 'src/modules/teamspace/domain/enums/teamspace-visibility.enum';

import { UpdatePageShareSettingCommand } from './update-page-share-setting.command';
import { UpdatePageShareSettingHandler } from './update-page-share-setting.handler';

describe('UpdatePageShareSettingHandler on teamspace pages', () => {
  let teamspaceId: string | null;
  let visibility: TeamspaceVisibility;
  let settings: { findByPageId: jest.Mock; save: jest.Mock };
  let handler: UpdatePageShareSettingHandler;

  beforeEach(() => {
    teamspaceId = 'teamspace';
    visibility = TeamspaceVisibility.OPEN;
    settings = {
      findByPageId: jest.fn().mockResolvedValue(null),
      save: jest.fn((setting: unknown) => Promise.resolve(setting)),
    };

    handler = new UpdatePageShareSettingHandler(
      settings as never,
      {
        findById: jest.fn(() =>
          Promise.resolve({ getTeamspaceId: () => teamspaceId }),
        ),
      } as never,
      {
        findTeamspace: jest.fn(() =>
          Promise.resolve({ id: 'teamspace', workspaceId: 'ws', visibility }),
        ),
        findMembership: jest.fn(),
      },
      { authorize: jest.fn().mockResolvedValue(true) } as never,
    );
  });

  const update = (
    workspace: ResourceAccessLevel | null | undefined,
    link: ResourceAccessLevel | null | undefined = undefined,
  ) =>
    handler.execute(
      new UpdatePageShareSettingCommand('user', 'page', workspace, link),
    );

  it.each([ResourceAccessLevel.EDITOR, ResourceAccessLevel.FULL_ACCESS])(
    'rejects workspace access %s and keeps the setting',
    async (level) => {
      await expect(update(level)).rejects.toBeInstanceOf(BadRequestException);
      expect(settings.save).not.toHaveBeenCalled();
    },
  );

  it.each([ResourceAccessLevel.VIEWER, null])(
    'saves workspace access %s in an open teamspace',
    async (level) => {
      const saved = await update(level);

      expect(saved.workspaceAccessLevel).toBe(level);
    },
  );

  it('rejects sharing a private teamspace page with the workspace', async () => {
    visibility = TeamspaceVisibility.PRIVATE;

    await expect(update(ResourceAccessLevel.VIEWER)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(settings.save).not.toHaveBeenCalled();
  });

  it('lets a private teamspace page turn workspace access off', async () => {
    visibility = TeamspaceVisibility.PRIVATE;

    const saved = await update(null, null);

    expect(saved.workspaceAccessLevel).toBeNull();
  });

  it('rejects an editing link and accepts a view-only link', async () => {
    visibility = TeamspaceVisibility.PRIVATE;

    await expect(
      update(null, ResourceAccessLevel.EDITOR),
    ).rejects.toBeInstanceOf(BadRequestException);

    const saved = await update(null, ResourceAccessLevel.VIEWER);

    expect(saved.linkAccessLevel).toBe(ResourceAccessLevel.VIEWER);
  });

  it('keeps every level for pages outside a teamspace', async () => {
    teamspaceId = null;

    const workspace = await update(ResourceAccessLevel.EDITOR);
    const link = await update(null, ResourceAccessLevel.EDITOR);

    expect(workspace.workspaceAccessLevel).toBe(ResourceAccessLevel.EDITOR);
    expect(link.linkAccessLevel).toBe(ResourceAccessLevel.EDITOR);
  });
});
