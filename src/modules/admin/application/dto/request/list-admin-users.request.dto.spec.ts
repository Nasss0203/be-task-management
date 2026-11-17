import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';
import { ListAdminUsersRequestDto } from './list-admin-users.request.dto';

function parse(query: Record<string, string>) {
  const dto = plainToInstance(ListAdminUsersRequestDto, query);

  return { dto, errors: validateSync(dto) };
}

describe('ListAdminUsersRequestDto', () => {
  it('accepts a request without filters', () => {
    const { dto, errors } = parse({});

    expect(errors).toHaveLength(0);
    expect(dto.isActive).toBeUndefined();
    expect(dto.systemRole).toBeUndefined();
  });

  it.each([
    ['true', true],
    ['false', false],
  ])('turns isActive=%s into %s', (raw, expected) => {
    const { dto, errors } = parse({ isActive: raw });

    expect(errors).toHaveLength(0);
    expect(dto.isActive).toBe(expected);
  });

  it('accepts a known system role', () => {
    const { dto, errors } = parse({ systemRole: 'SYSTEM_ADMIN' });

    expect(errors).toHaveLength(0);
    expect(dto.systemRole).toBe(SystemRole.SYSTEM_ADMIN);
  });

  it.each([
    [{ isActive: 'abc' }, 'isActive'],
    [{ systemRole: 'OWNER' }, 'systemRole'],
  ])('rejects %o', (query, property) => {
    const { errors } = parse(query);

    expect(errors.map((error) => error.property)).toEqual([property]);
  });
});
