// src/modules/sprints/dto/response/create-sprint.response.dto.ts

import { SprintStatus } from '../../domain/entities/sprint.entity';

export class SprintResponseDto {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  goal: string | null;
  status: SprintStatus;
  startAt: Date | null;
  endAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
