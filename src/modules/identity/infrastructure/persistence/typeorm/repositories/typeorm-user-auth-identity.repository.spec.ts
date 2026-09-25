import { UserAuthProvider } from 'src/modules/identity/domain/enums/user-auth-provider.enum';
import { UserAuthIdentityKey } from 'src/modules/identity/domain/repositories/user-auth-identity.repository';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { UserAuthIdentityOrmEntity } from '../entities/user-auth-identity.orm-entity';
import { TypeOrmUserAuthIdentityRepository } from './typeorm-user-auth-identity.repository';

const createKey = (tenantId: string | null): UserAuthIdentityKey => ({
  provider: UserAuthProvider.GOOGLE,
  issuer: 'https://accounts.google.com',
  providerSubject: 'google-subject-1',
  tenantId,
});

const createRepositoryMock = () => {
  const findOne = jest
    .fn<Repository<UserAuthIdentityOrmEntity>['findOne']>()
    .mockResolvedValue(null);
  const repository = {
    findOne,
  } as unknown as Repository<UserAuthIdentityOrmEntity>;

  return { findOne, repository };
};

describe('TypeOrmUserAuthIdentityRepository', () => {
  it('uses IS NULL for a null tenant stable key', async () => {
    const { findOne, repository } = createRepositoryMock();
    const service = new TypeOrmUserAuthIdentityRepository(repository);

    await expect(
      service.findByProviderIdentity(createKey(null)),
    ).resolves.toBeNull();

    expect(findOne).toHaveBeenCalledWith({
      where: {
        provider: UserAuthProvider.GOOGLE,
        issuer: 'https://accounts.google.com',
        providerSubject: 'google-subject-1',
        tenantId: IsNull(),
      },
    });
  });

  it('keeps different tenant IDs as different stable keys', async () => {
    const { findOne, repository } = createRepositoryMock();
    const service = new TypeOrmUserAuthIdentityRepository(repository);

    await service.findByProviderIdentity(createKey('tenant-a'));
    await service.findByProviderIdentity(createKey('tenant-b'));

    expect(findOne).toHaveBeenNthCalledWith(1, {
      where: expect.objectContaining({ tenantId: 'tenant-a' }),
    });
    expect(findOne).toHaveBeenNthCalledWith(2, {
      where: expect.objectContaining({ tenantId: 'tenant-b' }),
    });
  });

  it('uses the repository from the supplied persistence context', async () => {
    const defaultRepository = createRepositoryMock();
    const transactionalRepository = createRepositoryMock();
    const context = {
      getRepository: jest
        .fn()
        .mockReturnValue(transactionalRepository.repository),
    } as unknown as EntityManager;
    const service = new TypeOrmUserAuthIdentityRepository(
      defaultRepository.repository,
    );

    await service.findByProviderIdentity(createKey(null), context);

    expect(context.getRepository).toHaveBeenCalledWith(
      UserAuthIdentityOrmEntity,
    );
    expect(transactionalRepository.findOne).toHaveBeenCalledWith({
      where: expect.objectContaining({ tenantId: IsNull() }),
    });
    expect(defaultRepository.findOne).not.toHaveBeenCalled();
  });
});
