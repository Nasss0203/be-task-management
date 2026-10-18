import type {
  FindPurchaseHistoryFilters,
  FindPurchaseHistoryResult,
  TemplatePurchaseHistoryReadModel,
} from '../../../../domain/repositories/template-purchase-history.read-model';
import { TemplateVisibility } from '../../../../../template/domain/enums/template-visibility.enum';
import { PageTemplateOrmEntity } from '../../../../../template/infrastructure/persistence/typeorm/entities/page-template.orm-entity';
import { PageTemplateVersionOrmEntity } from '../../../../../template/infrastructure/persistence/typeorm/entities/page-template-version.orm-entity';
import { TemplatePurchaseStatus } from '../../../../domain/aggregates/template-purchase/template-purchase.aggregate';
import { Injectable } from '@nestjs/common';
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';

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

  async findHistoryByBuyer(
    filters: FindPurchaseHistoryFilters,
    context?: PersistenceContext,
  ): Promise<FindPurchaseHistoryResult> {
    const qb = this.getRepo(context)
      .createQueryBuilder('purchase')
      .leftJoin(PageTemplateOrmEntity, 'template', 'template.id = purchase.templateId')
      .leftJoin(
        PageTemplateVersionOrmEntity,
        'version',
        'version.id = purchase.publishedVersionId',
      )
      .select('purchase.id', 'id')
      .addSelect('purchase.orderCode', 'orderCode')
      .addSelect('purchase.templateId', 'templateId')
      .addSelect(
        'CASE WHEN template.visibility = :publicVisibility THEN template.name ELSE NULL END',
        'templateName',
      )
      .addSelect(
        'CASE WHEN template.visibility = :publicVisibility THEN template.icon ELSE NULL END',
        'templateIcon',
      )
      .addSelect('version.versionNumber', 'versionNumber')
      .addSelect('purchase.amount', 'amount')
      .addSelect('purchase.currency', 'currency')
      .addSelect('purchase.status', 'status')
      .addSelect('purchase.createdAt', 'createdAt')
      .addSelect('purchase.paidAt', 'paidAt')
      .where('purchase.buyerId = :buyerId', { buyerId: filters.buyerId })
      .setParameters({ publicVisibility: TemplateVisibility.PUBLIC });

    if (filters.cursor) {
      qb.andWhere(
        new Brackets((cursorQb) => {
          cursorQb
            .where('purchase.createdAt < :cursorCreatedAt')
            .orWhere(
              '(purchase.createdAt = :cursorCreatedAt AND purchase.id < :cursorId)',
            );
        }),
        {
          cursorCreatedAt: filters.cursor.createdAt,
          cursorId: filters.cursor.id,
        },
      );
    }

    const rows = await qb
      .orderBy('purchase.createdAt', 'DESC')
      .addOrderBy('purchase.id', 'DESC')
      .limit(filters.limit + 1)
      .getRawMany<
        Omit<TemplatePurchaseHistoryReadModel, 'amount' | 'versionNumber'> & {
          amount: string | number;
          versionNumber: number | null;
        }
      >();

    return {
      hasNextPage: rows.length > filters.limit,
      items: rows.slice(0, filters.limit).map((row) => ({
        ...row,
        // bigint arrives as a string from pg.
        amount: Number(row.amount),
        versionNumber: row.versionNumber ?? null,
      })),
    };
  }

  async existsByBuyerTemplateAndStatus(
    buyerId: string,
    templateId: string,
    status: TemplatePurchaseStatus,
    context?: PersistenceContext,
  ): Promise<boolean> {
    return this.getRepo(context).exists({
      where: { buyerId, templateId, status },
    });
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
