import { SystemHealthResponseDto } from '../../../dto/response/dashboard/system-health.response.dto';

export interface AdminSystemHealthRepository {
  getSystemHealth(): Promise<SystemHealthResponseDto[]>;
}
