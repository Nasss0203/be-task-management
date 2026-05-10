export type RecentActivityType = 'workspace' | 'user' | 'billing' | 'system';

export type RecentActivityLevel = 'info' | 'success' | 'warning' | 'danger';

export class RecentActivityResponseDto {
  id: string;
  title: string;
  description: string;
  time: string;
  type: RecentActivityType;
  level: RecentActivityLevel;
  createdAt: string;
}
