import { DataSource } from 'typeorm';
import { SystemRole } from 'src/modules/identity/domain/enums/system-role.enum';
import { TypeOrmAdminUserWriter } from './typeorm-admin-user.writer';

const USER_ID = '035b6e72-279a-4a6f-ab78-a1420cd6344c';
const UPDATED_AT = '2026-11-16T10:35:00.000Z';

function createWriter(queryResult: unknown) {
  const query = jest.fn().mockResolvedValue(queryResult);
  const writer = new TypeOrmAdminUserWriter({
    query,
  } as unknown as DataSource);

  return { writer, query };
}

describe('TypeOrmAdminUserWriter', () => {
  describe('updateUserStatus', () => {
    it('reads the row from the postgres [rows, affectedCount] result', async () => {
      const { writer, query } = createWriter([
        [{ id: USER_ID, isActive: false, updatedAt: UPDATED_AT }],
        1,
      ]);

      const result = await writer.updateUserStatus({
        userId: USER_ID,
        isActive: false,
      });

      expect(result).toEqual({
        id: USER_ID,
        isActive: false,
        updatedAt: new Date(UPDATED_AT),
      });
      expect(result?.updatedAt.getTime()).not.toBeNaN();
      expect(query).toHaveBeenCalledWith(expect.any(String), [false, USER_ID]);
    });

    it('returns null when no user was updated', async () => {
      const { writer } = createWriter([[], 0]);

      await expect(
        writer.updateUserStatus({ userId: USER_ID, isActive: true }),
      ).resolves.toBeNull();
    });

    it('reads a plain array of rows', async () => {
      const { writer } = createWriter([
        { id: USER_ID, isActive: true, updatedAt: UPDATED_AT },
      ]);

      await expect(
        writer.updateUserStatus({ userId: USER_ID, isActive: true }),
      ).resolves.toEqual({
        id: USER_ID,
        isActive: true,
        updatedAt: new Date(UPDATED_AT),
      });
    });

    it('returns null for an empty plain array', async () => {
      const { writer } = createWriter([]);

      await expect(
        writer.updateUserStatus({ userId: USER_ID, isActive: true }),
      ).resolves.toBeNull();
    });
  });

  describe('updateUserRole', () => {
    it('reads the row from the postgres [rows, affectedCount] result', async () => {
      const { writer, query } = createWriter([
        [
          {
            id: USER_ID,
            systemRole: SystemRole.SYSTEM_ADMIN,
            updatedAt: UPDATED_AT,
          },
        ],
        1,
      ]);

      const result = await writer.updateUserRole({
        userId: USER_ID,
        systemRole: SystemRole.SYSTEM_ADMIN,
      });

      expect(result).toEqual({
        id: USER_ID,
        systemRole: SystemRole.SYSTEM_ADMIN,
        updatedAt: new Date(UPDATED_AT),
      });
      expect(query).toHaveBeenCalledWith(expect.any(String), [
        SystemRole.SYSTEM_ADMIN,
        USER_ID,
      ]);
    });

    it('returns null when no user was updated', async () => {
      const { writer } = createWriter([[], 0]);

      await expect(
        writer.updateUserRole({
          userId: USER_ID,
          systemRole: SystemRole.USER,
        }),
      ).resolves.toBeNull();
    });
  });
});
