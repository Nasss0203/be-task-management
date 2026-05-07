import { SprintStatus } from '../domain/entities/sprint.entity';

export interface FindSprintQuery {
  keyword?: string;
  status?: SprintStatus;
  from?: Date;
  to?: Date;
}
