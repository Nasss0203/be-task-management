import 'dotenv/config';
import { randomBytes } from 'crypto';
import { isEmail } from 'class-validator';
import { DataSource } from 'typeorm';
import dataSource from '../data-source';
import { SystemRole } from '../../modules/identity/domain/enums/system-role.enum';
import { User } from '../../modules/identity/infrastructure/persistence/typeorm/entities/user.orm-entity';
import { TypeOrmUserRepository } from '../../modules/identity/infrastructure/persistence/typeorm/repositories/typeorm-user.repository';
import { hashIdentityPassword } from '../../modules/identity/infrastructure/security/password/password-hasher';

export class SuperAdminSeedError extends Error {}

export function readSuperAdminEnvironment(env: NodeJS.ProcessEnv) {
  for (const key of [
    'SUPER_ADMIN_EMAIL',
    'SUPER_ADMIN_USERNAME',
    'SUPER_ADMIN_PASSWORD',
  ]) {
    if (!env[key]?.trim()) {
      throw new SuperAdminSeedError(
        `Missing required environment variable: ${key}`,
      );
    }
  }
  const email = env.SUPER_ADMIN_EMAIL!.trim();
  const username = env.SUPER_ADMIN_USERNAME!.trim();
  const password = env.SUPER_ADMIN_PASSWORD!;
  if (!isEmail(email) || email.length > 255) {
    throw new SuperAdminSeedError('Invalid SUPER_ADMIN_EMAIL');
  }
  if (username.length > 100) {
    throw new SuperAdminSeedError(
      'SUPER_ADMIN_USERNAME exceeds 100 characters',
    );
  }
  if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new SuperAdminSeedError(
      'SUPER_ADMIN_PASSWORD must have at least 8 characters and at most 72 UTF-8 bytes',
    );
  }
  return { email, username, password };
}

export async function seedSuperAdmin(
  source: DataSource = dataSource,
  env: NodeJS.ProcessEnv = process.env,
): Promise<'created' | 'exists'> {
  const { email, username, password } = readSuperAdminEnvironment(env);
  if (source.isInitialized) {
    throw new SuperAdminSeedError(
      'Seed requires an independent DataSource connection',
    );
  }
  // The shared CLI DataSource logs SQL parameters by default. Never log hashes.
  source.setOptions({
    logging: false,
    synchronize: false,
    migrationsRun: false,
  });
  try {
    await source.initialize();
    return await source.transaction(async (manager) => {
      // Serialize concurrent executions of this seed. Unique indexes also protect
      // against accounts created by other application processes.
      await manager.query(
        "SELECT pg_advisory_xact_lock(hashtext('taskmanly:super-admin-seed'))",
      );
      const repo = manager.getRepository(User);
      const matches = await repo.find({
        where: [{ email }, { username }],
        withDeleted: true,
      });
      if (matches.length) {
        const existing = matches[0];
        if (
          matches.length !== 1 ||
          existing.email !== email ||
          existing.username !== username ||
          existing.systemRole !== SystemRole.SUPER_ADMIN
        ) {
          throw new SuperAdminSeedError(
            'Email or username conflicts with an existing account; no changes made',
          );
        }
        if (
          existing.deletedAt ||
          !existing.isActive ||
          !existing.passwordHash
        ) {
          throw new SuperAdminSeedError(
            'Super Admin exists but cannot log in locally; manual review required',
          );
        }
        return 'exists';
      }
      const identityRepository = new TypeOrmUserRepository(repo);
      const user = await identityRepository.createLocalUser({
        email,
        username,
        passwordHash: hashIdentityPassword(password),
        emailVerificationToken: randomBytes(32).toString('hex'),
        emailVerificationExpires: new Date(),
      });
      // Only the newly inserted user is changed, inside the same transaction.
      user.systemRole = SystemRole.SUPER_ADMIN;
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await identityRepository.save(user);
      return 'created';
    });
  } finally {
    if (source.isInitialized) await source.destroy();
  }
}

if (require.main === module) {
  seedSuperAdmin()
    .then((result) => {
      console.log(
        result === 'created'
          ? 'Super Admin created.'
          : 'Super Admin already exists; no changes made.',
      );
    })
    .catch((error: unknown) => {
      console.error(
        error instanceof SuperAdminSeedError
          ? error.message
          : 'Super Admin seed failed; check database configuration, schema and identifier conflicts. No credentials are logged.',
      );
      process.exitCode = 1;
    });
}
