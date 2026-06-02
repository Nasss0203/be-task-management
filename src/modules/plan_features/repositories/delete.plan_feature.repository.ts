import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { PlanFeature } from '../domain/entities/plan_feature.entity';
import { DeletePlanFeatureRepository } from '../interfaces/repositories/delete.plan_feature.repository.interface';

@Injectable()
export class DeletePlanFeatureRepositoryImpl
  implements DeletePlanFeatureRepository
{
  constructor(
    @InjectRepository(PlanFeature)
    private readonly repo: Repository<PlanFeature>,
  ) {}

  private getRepo(manager?: EntityManager): Repository<PlanFeature> {
    return manager ? manager.getRepository(PlanFeature) : this.repo;
  }

  async softDelete(id: string, manager?: EntityManager): Promise<void> {
    await this.getRepo(manager).softDelete(id);
  }
}
