import { FindActivityResult } from '../repositories/find-activity.repository.interface';
import { FindActivityFilters } from '../repositories/find-activity.repository.interface';

export interface FindActivityService {
  findMany(filters: FindActivityFilters): Promise<FindActivityResult>;
}
