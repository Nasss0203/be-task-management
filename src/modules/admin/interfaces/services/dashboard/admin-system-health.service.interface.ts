import { SystemHealthResponseDto } from '../../../dto/response/dashboard/system-health.response.dto';

export interface AdminSystemHealthService {
  getSystemHealth(): Promise<SystemHealthResponseDto[]>;
}
