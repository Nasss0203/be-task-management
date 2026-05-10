export type SystemHealthLevel = 'success' | 'warning' | 'danger';

export class SystemHealthResponseDto {
  key: string;
  label: string;
  value: string;
  level: SystemHealthLevel;
  description: string;
}
