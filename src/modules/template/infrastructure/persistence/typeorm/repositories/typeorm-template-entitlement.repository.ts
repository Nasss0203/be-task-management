import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import type { PersistenceContext } from 'src/shared/domain/persistence-context';

import type { TemplateEntitlement } from '../../../../domain/aggregates/template-entitlement/template-entitlement.aggregate';
import type { TemplateEntitlementRepository } from '../../../../domain/repositories/template-entitlement.repository';
import { TemplateEntitlementOrmEntity } from '../entities/template-entitlement.orm-entity';
import { TemplateEntitlementMapper } from '../mappers/template-entitlement.mapper';

@Injectable()
export class TypeOrmTemplateEntitlementRepository implements TemplateEntitlementRepository {
  constructor(private readonly dataSource: DataSource) {}

  async create(
    entitlement: TemplateEntitlement,
    context?: PersistenceContext,
  ): Promise<TemplateEntitlement> {
    const repository = this.getRepo(context);
    const saved = await repository.save(
      TemplateEntitlementMapper.toOrm(entitlement),
    );

    return TemplateEntitlementMapper.toDomain(saved);
  }

  async findByTemplateAndUser(
    templateId: string,
    userId: string,
    context?: PersistenceContext,
  ): Promise<TemplateEntitlement | null> {
    const repository = this.getRepo(context);
    const entity = await repository.findOne({
      where: { templateId, userId },
    });

    return entity ? TemplateEntitlementMapper.toDomain(entity) : null;
  }

  private getRepo(
    context?: PersistenceContext,
  ): Repository<TemplateEntitlementOrmEntity> {
    const manager = context as EntityManager | undefined;

    return manager
      ? manager.getRepository(TemplateEntitlementOrmEntity)
      : this.dataSource.getRepository(TemplateEntitlementOrmEntity);
  }
}
