import { RetentionMetricResponseDto } from '../../../dto/response/dashboard/retention-metrics.response.dto';

export interface AdminRetentionMetricsService {
  getRetentionMetrics(): Promise<RetentionMetricResponseDto[]>;
}
