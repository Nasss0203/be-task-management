import { FindActivityResult } from '../../domain/repositories/find-activity.repository';
import { FindActivityFilters } from '../../domain/repositories/find-activity.repository';

export interface FindActivityService {
  findMany(filters: FindActivityFilters): Promise<FindActivityResult>;
}
