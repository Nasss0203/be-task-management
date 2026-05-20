import { RetentionMetricResponseDto } from '../../../dto/response/dashboard/retention-metrics.response.dto';

export interface AdminRetentionMetricsRepository {
  getRetentionMetrics(): Promise<RetentionMetricResponseDto[]>;
}
