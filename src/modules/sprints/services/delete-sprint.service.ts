import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { type DeleteSprintRepository } from '../interfaces/repositories/delete-sprint.repository.interface';
import { DeleteSprintService } from '../interfaces/services/delete-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';

@Injectable()
export class DeleteSprintServiceImpl implements DeleteSprintService {
  constructor(
    @Inject(SPRINT_TYPES.repositories.DeleteSprintRepository)
    private readonly deleteSprintRepository: DeleteSprintRepository,
  ) {}

  softDeleteSprint(
    input: {
      sprintId: string;
      deletedBy: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    return this.deleteSprintRepository.softDeleteSprint(input, manager);
  }

  restoreSprint(
    input: {
      sprintId: string;
    },
    manager?: EntityManager,
  ): Promise<void> {
    return this.deleteSprintRepository.restoreSprint(input, manager);
  }
}
