import { EntityManager, Repository } from 'typeorm';
import { PageOrmEntity } from '../entities/page.orm-entity';
import { TypeOrmPageRepository } from './typeorm-page.repository';

describe('TypeOrmPageRepository', () => {
  it('counts soft-deleted pages when checking a public subdomain', async () => {
    const exists = jest.fn().mockResolvedValue(true);
    const context = {
      getRepository: () => ({ exists }),
    } as unknown as EntityManager;
    const repository = new TypeOrmPageRepository(
      {} as Repository<PageOrmEntity>,
    );

    await expect(
      repository.existsByPublicSubdomain('page-2', context),
    ).resolves.toBe(true);

    expect(exists).toHaveBeenCalledWith({
      where: { public_subdomain: 'page-2' },
      withDeleted: true,
    });
  });
});
