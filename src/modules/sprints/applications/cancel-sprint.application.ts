// src/modules/sprints/applications/cancel-sprint.application.ts

import { Inject, Injectable } from '@nestjs/common';
import { type UnitOfWork } from 'src/interface/index.interface';
import { SprintResponseDto } from '../dto/response/sprint.response.dto';
import {
  CancelSprintApplication,
  CancelSprintApplicationInput,
} from '../interfaces/applications/cancel-sprint.application.interface';
import { type CancelSprintService } from '../interfaces/services/cancel-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class CancelSprintApplicationImpl implements CancelSprintApplication {
  constructor(
    @Inject(SPRINT_TYPES.uow.UnitOfWork)
    private readonly unitOfWork: UnitOfWork,

    @Inject(SPRINT_TYPES.services.CancelSprintService)
    private readonly cancelSprintService: CancelSprintService,
  ) {}

  async cancelSprint(
    input: CancelSprintApplicationInput,
  ): Promise<SprintResponseDto> {
    const sprint = await this.unitOfWork.runInTransaction(async (manager) => {
      return await this.cancelSprintService.cancelSprint(input, manager);
    });

    return SprintsMapper.toResponse(sprint);
  }
}
