import { SystemHealthResponseDto } from '../../../dto/response/dashboard/system-health.response.dto';

export interface AdminSystemHealthApplication {
  getSystemHealth(): Promise<SystemHealthResponseDto[]>;
}
