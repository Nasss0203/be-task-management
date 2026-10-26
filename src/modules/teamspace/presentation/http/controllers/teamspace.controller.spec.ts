import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { TeamspaceController } from './teamspace.controller';

describe('Teamspace update role route parameters', () => {
  it('applies ParseUUIDPipe to both path IDs', async () => {
    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      TeamspaceController,
      'updateMemberRole',
    ) as Record<string, { data?: string; pipes: unknown[] }>;
    for (const name of ['teamspaceId', 'memberId']) {
      const parameter = Object.values(metadata).find(
        (item) => item.data === name,
      );
      expect(parameter?.pipes).toContain(ParseUUIDPipe);
    }
    await expect(
      new ParseUUIDPipe().transform('invalid', { type: 'param' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
