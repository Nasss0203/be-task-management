import { RetentionMetricResponseDto } from '../../../dto/response/dashboard/retention-metrics.response.dto';

export interface AdminRetentionMetricsApplication {
  getRetentionMetrics(): Promise<RetentionMetricResponseDto[]>;
}
