import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { TemplatePurchase } from '../../../../domain/aggregates/template-purchase/template-purchase.aggregate';
import type { TemplatePurchaseRepository } from '../../../../domain/repositories/template-purchase.repository';

import { TemplatePurchaseOrmEntity } from '../entities/template-purchase.orm-entity';
import { TemplatePurchaseMapper } from '../mappers/template-purchase.mapper';

@Injectable()
export class TypeOrmTemplatePurchaseRepository implements TemplatePurchaseRepository {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    purchase: TemplatePurchase,
    context?: PersistenceContext,
  ): Promise<TemplatePurchase> {
    const repository = this.getRepo(context);

    await repository.insert(TemplatePurchaseMapper.toOrm(purchase));

    return purchase;
  }

  async save(
    purchase: TemplatePurchase,
    context?: PersistenceContext,
  ): Promise<TemplatePurchase> {
    const repository = this.getRepo(context);

    const saved = await repository.save(TemplatePurchaseMapper.toOrm(purchase));

    return TemplatePurchaseMapper.toDomain(saved);
  }

  async findById(
    id: string,
    context?: PersistenceContext,
  ): Promise<TemplatePurchase | null> {
    const entity = await this.getRepo(context).findOne({
      where: { id },
    });

    return entity ? TemplatePurchaseMapper.toDomain(entity) : null;
  }

  async findByOrderCode(
    orderCode: string,
    context?: PersistenceContext,
  ): Promise<TemplatePurchase | null> {
    const entity = await this.getRepo(context).findOne({
      where: { orderCode },
    });

    return entity ? TemplatePurchaseMapper.toDomain(entity) : null;
  }

  async findByBuyerAndIdempotencyKey(
    buyerId: string,
    idempotencyKey: string,
    context?: PersistenceContext,
  ): Promise<TemplatePurchase | null> {
    const entity = await this.getRepo(context).findOne({
      where: {
        buyerId,
        idempotencyKey,
      },
    });

    return entity ? TemplatePurchaseMapper.toDomain(entity) : null;
  }

  async findByIdForUpdate(
    id: string,
    context: PersistenceContext,
  ): Promise<TemplatePurchase | null> {
    const repository = this.getTransactionalRepo(context);

    const entity = await repository.findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });

    return entity ? TemplatePurchaseMapper.toDomain(entity) : null;
  }

  async findByOrderCodeForUpdate(
    orderCode: string,
    context: PersistenceContext,
  ): Promise<TemplatePurchase | null> {
    const repository = this.getTransactionalRepo(context);

    const entity = await repository.findOne({
      where: { orderCode },
      lock: { mode: 'pessimistic_write' },
    });

    return entity ? TemplatePurchaseMapper.toDomain(entity) : null;
  }

  private getTransactionalRepo(
    context: PersistenceContext,
  ): Repository<TemplatePurchaseOrmEntity> {
    const manager = context as EntityManager;

    if (!manager?.queryRunner?.isTransactionActive) {
      throw new Error('Purchase row lock requires an active transaction');
    }

    return manager.getRepository(TemplatePurchaseOrmEntity);
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<TemplatePurchaseOrmEntity> {
    const manager = context as EntityManager | undefined;

    return manager
      ? manager.getRepository(TemplatePurchaseOrmEntity)
      : this.dataSource.getRepository(TemplatePurchaseOrmEntity);
  }
}
