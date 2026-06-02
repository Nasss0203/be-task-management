export class FeatureResponseDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  isActive: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
