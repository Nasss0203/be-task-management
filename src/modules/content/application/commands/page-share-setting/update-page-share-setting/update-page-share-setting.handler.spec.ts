import { BadRequestException } from '@nestjs/common';

import { ResourceAccessLevel } from 'src/modules/content/domain/constants/resource-access-level.constant';

import { UpdatePageShareSettingCommand } from './update-page-share-setting.command';
import { UpdatePageShareSettingHandler } from './update-page-share-setting.handler';

describe('UpdatePageShareSettingHandler workspace access on teamspace pages', () => {
  let teamspaceId: string | null;
  let settings: { findByPageId: jest.Mock; save: jest.Mock };
  let handler: UpdatePageShareSettingHandler;

  beforeEach(() => {
    teamspaceId = 'teamspace';
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
      { authorize: jest.fn().mockResolvedValue(true) } as never,
    );
  });

  const update = (level: ResourceAccessLevel | null) =>
    handler.execute(
      new UpdatePageShareSettingCommand('user', 'page', level, undefined),
    );

  it.each([ResourceAccessLevel.EDITOR, ResourceAccessLevel.FULL_ACCESS])(
    'rejects %s and keeps the setting',
    async (level) => {
      await expect(update(level)).rejects.toBeInstanceOf(BadRequestException);
      expect(settings.save).not.toHaveBeenCalled();
    },
  );

  it.each([ResourceAccessLevel.VIEWER, null])('saves %s', async (level) => {
    const saved = await update(level);

    expect(saved.workspaceAccessLevel).toBe(level);
  });

  it('keeps every level for pages outside a teamspace', async () => {
    teamspaceId = null;

    const saved = await update(ResourceAccessLevel.EDITOR);

    expect(saved.workspaceAccessLevel).toBe(ResourceAccessLevel.EDITOR);
  });
});
