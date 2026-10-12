import { randomBytes } from 'crypto';
import { DataSource } from 'typeorm';
import { User } from '../../modules/identity/infrastructure/persistence/typeorm/entities/user.orm-entity';
import { seedSuperAdmin, readSuperAdminEnvironment } from './super-admin.seed';
import { SystemRole } from '../../modules/identity/domain/enums/system-role.enum';
import { verifyIdentityPassword } from '../../modules/identity/infrastructure/security/password/password-hasher';
import { AdminAccessPolicy } from '../../modules/admin/domain/policies/admin-access.policy';
import { AdminActor } from '../../modules/admin/domain/value-objects/admin-actor.vo';
import { ADMIN_PERMISSIONS } from '../../modules/admin/domain/permissions/admin-permission-code';

describe('Super Admin seed (no database connection)', () => {
  const environment = () => ({
    SUPER_ADMIN_EMAIL: 'seed@example.invalid',
    SUPER_ADMIN_USERNAME: 'seed-test',
    SUPER_ADMIN_PASSWORD: randomBytes(24).toString('hex'),
  });
  function setup(matches: object[] = []) {
    const repo = {
      find: jest.fn().mockResolvedValue(matches),
      create: jest.fn(
        (input: Partial<User>): User =>
          Object.assign(new User(), { id: 'new-id' }, input),
      ),
      save: jest.fn((input: User) => Promise.resolve(input)),
    };
    const manager = { query: jest.fn(), getRepository: jest.fn(() => repo) };
    const source = {
      isInitialized: false,
      setOptions: jest.fn(),
      initialize: jest.fn(() => {
        source.isInitialized = true;
        return Promise.resolve();
      }),
      destroy: jest.fn(() => {
        source.isInitialized = false;
        return Promise.resolve();
      }),
      transaction: jest.fn(
        (callback: (context: typeof manager) => Promise<string>) =>
          callback(manager),
      ),
    };
    return {
      source,
      repo,
      run: (env = environment()) =>
        seedSuperAdmin(source as unknown as DataSource, env),
    };
  }

  it('creates a verified active local account with Identity bcrypt hashing and Super Admin permissions', async () => {
    const { source, repo, run } = setup();
    const env = environment();
    await expect(run(env)).resolves.toBe('created');
    const user = repo.save.mock.calls[1][0];
    expect(user).toMatchObject({
      systemRole: SystemRole.SUPER_ADMIN,
      isActive: true,
      isEmailVerified: true,
      emailVerificationToken: null,
    });
    expect(user.passwordHash).not.toBe(env.SUPER_ADMIN_PASSWORD);
    expect(
      verifyIdentityPassword(env.SUPER_ADMIN_PASSWORD, user.passwordHash!),
    ).toBe(true);
    expect(source.setOptions).toHaveBeenCalledWith({
      logging: false,
      synchronize: false,
      migrationsRun: false,
    });
    expect(source.destroy).toHaveBeenCalledTimes(1);
    expect(
      AdminAccessPolicy.hasPermission(
        new AdminActor({ userId: user.id, systemRole: user.systemRole }),
        ADMIN_PERMISSIONS.TEMPLATE_CATEGORIES_CREATE,
      ),
    ).toBe(true);
  });

  it('leaves an exact existing Super Admin unchanged', async () => {
    const env = environment();
    const { repo, run } = setup([
      {
        email: env.SUPER_ADMIN_EMAIL,
        username: env.SUPER_ADMIN_USERNAME,
        systemRole: SystemRole.SUPER_ADMIN,
        isActive: true,
        passwordHash: 'existing-hash',
      },
    ]);
    await expect(run(env)).resolves.toBe('exists');
    expect(repo.save).not.toHaveBeenCalled();
    expect(repo.create).not.toHaveBeenCalled();
  });

  it.each([
    [{ systemRole: SystemRole.USER }],
    [{ email: 'other@example.invalid', systemRole: SystemRole.SUPER_ADMIN }],
    [{ username: 'other', systemRole: SystemRole.SUPER_ADMIN }],
    [{ systemRole: SystemRole.SUPER_ADMIN }, { systemRole: SystemRole.USER }],
  ])(
    'rejects conflicting identifiers without writes: %j',
    async (...rows: Partial<User>[]) => {
      const env = environment();
      const { source, repo, run } = setup(
        rows.map((row) => ({
          email: env.SUPER_ADMIN_EMAIL,
          username: env.SUPER_ADMIN_USERNAME,
          ...row,
        })),
      );
      await expect(run(env)).rejects.toThrow('conflicts');
      expect(repo.save).not.toHaveBeenCalled();
      expect(source.destroy).toHaveBeenCalled();
    },
  );

  it.each([
    'SUPER_ADMIN_EMAIL',
    'SUPER_ADMIN_USERNAME',
    'SUPER_ADMIN_PASSWORD',
  ])('rejects missing %s before connecting', async (key) => {
    const env = environment();
    delete env[key];
    const { source, run } = setup();
    await expect(run(env)).rejects.toThrow(key);
    expect(source.initialize).not.toHaveBeenCalled();
  });

  it('rejects bcrypt truncation and invalid email without exposing values', () => {
    const env = environment();
    expect(() =>
      readSuperAdminEnvironment({
        ...env,
        SUPER_ADMIN_PASSWORD: randomBytes(50).toString('hex'),
      }),
    ).toThrow('72 UTF-8 bytes');
    expect(() =>
      readSuperAdminEnvironment({ ...env, SUPER_ADMIN_EMAIL: 'invalid' }),
    ).toThrow('Invalid SUPER_ADMIN_EMAIL');
  });

  it('closes the connection after a persistence failure', async () => {
    const { source, repo, run } = setup();
    repo.save.mockRejectedValueOnce(new Error('database failure'));
    await expect(run()).rejects.toThrow('database failure');
    expect(source.destroy).toHaveBeenCalled();
  });
});
