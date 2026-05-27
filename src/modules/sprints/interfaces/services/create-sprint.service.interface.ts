// src/modules/sprints/interfaces/services/create-sprint.service.interface.ts

import { EntityManager } from 'typeorm';

import { SprintsModel } from '../../domain/models/sprints.model';
import { SaveSprintInput } from '../repositories/create-sprint.repository.interface';

export type CreateSprintServiceInput = Omit<SaveSprintInput, 'name'> & {
  name?: string | null;
};

export interface CreateSprintService {
  create(
    input: CreateSprintServiceInput,
    manager?: EntityManager,
  ): Promise<SprintsModel>;
}
