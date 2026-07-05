import { AiAppliedEntityType } from '../../domain/enums/ai-applied-entity-type.enum';

export type AiAppliedResult = {
  entityType: AiAppliedEntityType;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown> | null;
};
