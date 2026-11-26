import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { DisableAdminPublishedSiteRequestDto } from './disable-admin-published-site.request.dto';

function errorsFor(reason: unknown): string[] {
  const dto = plainToInstance(DisableAdminPublishedSiteRequestDto, { reason });

  return validateSync(dto).map((error) => error.property);
}

describe('DisableAdminPublishedSiteRequestDto', () => {
  it.each([
    ['ab', ['reason']],
    ['  ab  ', ['reason']],
    ['abc', []],
    ['a'.repeat(500), []],
    ['a'.repeat(501), ['reason']],
    [undefined, ['reason']],
  ])('validates reason %p', (reason, expected) => {
    expect(errorsFor(reason)).toEqual(expected);
  });
});
