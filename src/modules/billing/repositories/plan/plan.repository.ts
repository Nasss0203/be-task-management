import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { Plan } from '../../domain/entities/plan.entity';
import { type PlanRepository } from '../../interfaces/repositories/plan/plan.repository.interface';

@Injectable()
export class PlanRepositoryImpl implements PlanRepository {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<Plan> {
    return manager?.getRepository(Plan) ?? this.planRepository;
  }

  findActivePlanById(
    planId: string,
    manager?: EntityManager,
  ): Promise<Plan | null> {
    return this.getRepository(manager).findOne({
      where: {
        id: planId,
        isActive: true,
      },
    });
  }
}
