import { EntityManager } from 'typeorm';
import { Plan } from '../../../domain/entities/plan.entity';

export interface PlanRepository {
  findActivePlanById(
    planId: string,
    manager?: EntityManager,
  ): Promise<Plan | null>;
}
