import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { PersistenceContext } from 'src/shared/infrastructure/persistence/persistence-context';
import { EntityManager } from 'typeorm';
import { OutboxDeliveryOrmEntity, type OutboxDeliveryChannel } from './outbox-delivery.orm-entity';
import type { TeamspaceInvitationDeliveryOutbox } from './teamspace-invitation-delivery.port';

export const TEAMSPACE_INVITATION_DELIVERY_EVENT = 'teamspace.invitation.delivery.requested';
export const TEAMSPACE_INVITATION_DELIVERY_VERSION = 1;

@Injectable()
export class TypeOrmTeamspaceInvitationDeliveryOutbox implements TeamspaceInvitationDeliveryOutbox {
  async enqueue(invitationId: string, context: PersistenceContext): Promise<void> {
    const manager = context as EntityManager;
    if (!manager.queryRunner?.isTransactionActive) {
      throw new Error('Invitation delivery intent requires an active transaction');
    }
    const actionId = randomUUID();
    const channels: OutboxDeliveryChannel[] = ['IN_APP_NOTIFICATION', 'EMAIL'];
    await manager.getRepository(OutboxDeliveryOrmEntity).insert(channels.map((channel) => ({
      id: randomUUID(),
      deliveryKey: `${actionId}:${channel}`,
      eventType: TEAMSPACE_INVITATION_DELIVERY_EVENT,
      eventVersion: TEAMSPACE_INVITATION_DELIVERY_VERSION,
      aggregateId: invitationId,
      channel,
      payload: { invitationId },
      status: 'PENDING' as const,
      attemptCount: 0,
      nextAttemptAt: new Date(),
      lockedUntil: null,
      lockedBy: null,
      processedAt: null,
      lastError: null,
    })));
  }
}
