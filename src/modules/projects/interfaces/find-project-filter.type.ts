import { ProjectVisibility } from '../domain/entities/project.entity';

export type FindProjectFilter = {
  keyword?: string;
  visibility?: ProjectVisibility;
  createdBy?: string;
};
