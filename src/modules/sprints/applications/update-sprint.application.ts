// src/modules/sprints/applications/update-sprint.application.ts

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { SprintResponseDto } from '../dto/response/sprint.response.dto';
import {
  UpdateSprintApplication,
  UpdateSprintApplicationInput,
} from '../interfaces/applications/update-sprint.application.interface';
import { type UpdateSprintService } from '../interfaces/services/udpdate-sprint.service.interface';
import { SPRINT_TYPES } from '../interfaces/types';
import { SprintsMapper } from '../mapper/sprints.mapper';

@Injectable()
export class UpdateSprintApplicationImpl implements UpdateSprintApplication {
  constructor(
    private readonly dataSource: DataSource,

    @Inject(SPRINT_TYPES.services.UpdateSprintService)
    private readonly updateSprintService: UpdateSprintService,
  ) {}

  async updateSprint(
    input: UpdateSprintApplicationInput,
  ): Promise<SprintResponseDto> {
    const updatedSprint = await this.dataSource.transaction(async (manager) => {
      return await this.updateSprintService.updateSprint(
        {
          id: input.sprintId,
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          name: input.name,
          goal: input.goal,
          startAt: input.startAt,
          endAt: input.endAt,
        },
        manager,
      );
    });

    return SprintsMapper.toResponse(updatedSprint);
  }
}
