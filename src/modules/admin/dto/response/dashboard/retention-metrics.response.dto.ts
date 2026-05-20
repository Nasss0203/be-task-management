export type RetentionMetricLevel = 'success' | 'warning' | 'danger';

export class RetentionMetricResponseDto {
  key: string;
  label: string;
  value: number;
  suffix: string;
  description: string;
  level: RetentionMetricLevel;
}
