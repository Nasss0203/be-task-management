import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AdminWorkspaceStatusFilter } from '../../ports/admin-workspace-reader.port';
import { ListAdminWorkspacesRequestDto } from './list-admin-workspaces.request.dto';

function parse(query: Record<string, string>) {
  const dto = plainToInstance(ListAdminWorkspacesRequestDto, query);

  return { dto, errors: validateSync(dto) };
}

describe('ListAdminWorkspacesRequestDto', () => {
  it('accepts a request without status', () => {
    const { dto, errors } = parse({});

    expect(errors).toHaveLength(0);
    expect(dto.status).toBeUndefined();
  });

  it.each(['ACTIVE', 'TRASHED', 'ALL'])('accepts status=%s', (status) => {
    const { dto, errors } = parse({ status });

    expect(errors).toHaveLength(0);
    expect(dto.status).toBe(status as AdminWorkspaceStatusFilter);
  });

  it.each(['abc', 'active', 'ARCHIVED'])('rejects status=%s', (status) => {
    const { errors } = parse({ status });

    expect(errors.map((error) => error.property)).toEqual(['status']);
  });
});
