import { TaskResponseDto } from 'src/modules/tasks/dto/response/task-response.dto';
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
  completedAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
  tasks?: TaskResponseDto[];
}
