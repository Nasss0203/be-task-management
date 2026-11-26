import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { UpdatePagePublicationSettingsDto } from './update-page-publication-settings.dto';

function errorsFor(body: Record<string, unknown>): string[] {
  const dto = plainToInstance(UpdatePagePublicationSettingsDto, body);

  return validateSync(dto).map((error) => error.property);
}

const ATTACHMENT_ID = '070c81db-2d8e-44b6-af25-51ad60e3eece';

describe('UpdatePagePublicationSettingsDto theme', () => {
  it.each([
    [{ accent_color: '#E11D48' }, []],
    [{ accent_color: null }, []],
    [{ accent_color: 'red' }, ['accent_color']],
    [{ accent_color: '#e11d4' }, ['accent_color']],
    [{ accent_color: 'e11d48' }, ['accent_color']],
    [{ logo_attachment_id: ATTACHMENT_ID }, []],
    [{ logo_attachment_id: null, favicon_attachment_id: null }, []],
    [{ logo_attachment_id: 'logo.png' }, ['logo_attachment_id']],
    [
      { favicon_attachment_id: 'https://evil.test/x.png' },
      ['favicon_attachment_id'],
    ],
  ])('validates %p', (body, expected) => {
    expect(errorsFor(body)).toEqual(expected);
  });
});
