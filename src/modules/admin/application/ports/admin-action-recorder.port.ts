import type { AdminActionEntry } from '../../domain/audit/admin-action';

export interface AdminActionRecorder {
  record(entry: AdminActionEntry): Promise<void>;
}
