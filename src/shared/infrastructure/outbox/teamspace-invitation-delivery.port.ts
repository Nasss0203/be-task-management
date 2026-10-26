import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';

export const TEAMSPACE_INVITATION_DELIVERY_OUTBOX = Symbol('TeamspaceInvitationDeliveryOutbox');

export interface TeamspaceInvitationDeliveryOutbox {
  enqueue(invitationId: string, context: PersistenceContext): Promise<void>;
}
