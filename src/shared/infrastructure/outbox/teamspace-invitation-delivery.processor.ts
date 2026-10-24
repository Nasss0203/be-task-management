import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MailService } from 'src/modules/mail/application/services/mail.service';
import type { CreateNotificationService } from 'src/modules/notifications/application/ports/create-notification.service.port';
import { NotificationSenderType, NotificationSourceType, NotificationType } from 'src/modules/notifications/domain/entities/notification.entity';
import { NOTIFICATION_TYPES } from 'src/modules/notifications/notifications.types';
import { DataSource } from 'typeorm';
import { TEAMSPACE_INVITATION_DELIVERY_EVENT, TEAMSPACE_INVITATION_DELIVERY_VERSION } from './typeorm-teamspace-invitation-delivery-outbox';
import type { OutboxDeliveryChannel } from './outbox-delivery.orm-entity';

type ClaimedDelivery = {
  id: string;
  event_type: string;
  event_version: number;
  aggregate_id: string;
  channel: OutboxDeliveryChannel;
  payload: { invitationId?: string };
  attempt_count: number;
  locked_by: string;
};

type InvitationRecipient = {
  invitation_id: string;
  teamspace_id: string;
  teamspace_name: string;
  workspace_id: string;
  workspace_name: string;
  recipient_user_id: string;
  recipient_email: string;
  recipient_name: string;
  inviter_user_id: string | null;
  inviter_name: string | null;
  expires_at: Date;
};

class UnsupportedDeliveryEvent extends Error {}

@Injectable()
export class TeamspaceInvitationDeliveryProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TeamspaceInvitationDeliveryProcessor.name);
  private timer?: NodeJS.Timeout;
  private currentPoll: Promise<void> | null = null;
  private shuttingDown = false;
  private readonly batchSize = this.configNumber('OUTBOX_BATCH_SIZE', 10, 1, 100);
  private readonly pollIntervalMs = this.configNumber('OUTBOX_POLL_INTERVAL_MS', 5000, 1000, 60000);
  private readonly maxAttempts = this.configNumber('OUTBOX_MAX_ATTEMPTS', 8, 1, 50);
  private readonly lockTimeoutMs = this.configNumber('OUTBOX_LOCK_TIMEOUT_MS', 60000, 20000, 300000);

  constructor(
    private readonly dataSource: DataSource,
    @Inject(NOTIFICATION_TYPES.services.CreateNotificationService)
    private readonly notifications: CreateNotificationService,
    private readonly mailService: MailService,
  ) {}

  onModuleInit(): void {
    if (process.env.OUTBOX_PROCESSING_ENABLED !== 'true') {
      this.logger.log('Teamspace invitation delivery processor is disabled');
      return;
    }
    this.timer = setInterval(() => { this.triggerPoll(); }, this.pollIntervalMs);
    this.timer.unref();
    this.triggerPoll();
    this.logger.log('Teamspace invitation delivery processor started');
  }

  async onModuleDestroy(): Promise<void> {
    this.shuttingDown = true;
    if (this.timer) clearInterval(this.timer);
    await this.currentPoll;
  }

  private configNumber(name: string, fallback: number, min: number, max: number): number {
    const value = Number(process.env[name] ?? fallback);
    return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
  }

  private triggerPoll(): void {
    if (this.shuttingDown || this.currentPoll) return;
    this.currentPoll = this.poll().finally(() => { this.currentPoll = null; });
  }

  private async poll(): Promise<void> {
    try {
      for (let count = 0; count < this.batchSize && !this.shuttingDown; count++) {
        const delivery = await this.claimOne();
        if (!delivery) break;
        await this.process(delivery);
      }
    } catch (error) {
      this.logger.error(`Outbox polling failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  private async claimOne(): Promise<ClaimedDelivery | null> {
    const owner = randomUUID();
    const rows = await this.dataSource.transaction((manager) => manager.query<ClaimedDelivery[]>(`
      UPDATE outbox_deliveries AS delivery
      SET status = 'PROCESSING', attempt_count = attempt_count + 1,
          locked_by = $1, locked_until = now() + ($2::integer * interval '1 millisecond'),
          updated_at = now()
      WHERE delivery.id = (
        SELECT id FROM outbox_deliveries
        WHERE (status = 'PENDING' AND next_attempt_at <= now())
           OR (status = 'PROCESSING' AND locked_until <= now())
        ORDER BY next_attempt_at, created_at
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING delivery.id, delivery.event_type, delivery.event_version,
                delivery.aggregate_id, delivery.channel, delivery.payload,
                delivery.attempt_count, delivery.locked_by
    `, [owner, this.lockTimeoutMs]));
    return rows[0] ?? null;
  }

  private async process(delivery: ClaimedDelivery): Promise<void> {
    let renewing = false;
    const heartbeat = setInterval(() => {
      if (renewing) return;
      renewing = true;
      void this.renewLease(delivery)
        .catch((error: unknown) => {
          this.logger.warn(`Could not renew outbox lease ${delivery.id}: ${error instanceof Error ? error.message : 'unknown error'}`);
        })
        .finally(() => { renewing = false; });
    }, Math.max(1000, Math.floor(this.lockTimeoutMs / 3)));
    heartbeat.unref();
    try {
      if (delivery.event_type !== TEAMSPACE_INVITATION_DELIVERY_EVENT ||
        delivery.event_version !== TEAMSPACE_INVITATION_DELIVERY_VERSION ||
        delivery.payload?.invitationId !== delivery.aggregate_id ||
        !['IN_APP_NOTIFICATION', 'EMAIL'].includes(delivery.channel)) {
        throw new UnsupportedDeliveryEvent('Unsupported outbox event type, version, payload, or channel');
      }
      const recipient = await this.resolveRecipient(delivery.aggregate_id);
      if (!recipient) {
        await this.finish(delivery, 'SKIPPED');
        return;
      }
      // If a long lookup outlived the lease, the previous worker must not deliver.
      if (!(await this.renewLease(delivery))) return;
      if (delivery.channel === 'IN_APP_NOTIFICATION') {
        await this.notifications.createNotificationOnce(delivery.id, {
          receiverId: recipient.recipient_user_id,
          senderType: recipient.inviter_user_id ? NotificationSenderType.USER : NotificationSenderType.SYSTEM,
          actorId: recipient.inviter_user_id,
          sourceType: NotificationSourceType.TEAMSPACE,
          sourceId: recipient.teamspace_id,
          workspaceId: recipient.workspace_id,
          type: NotificationType.TEAMSPACE_INVITATION_RECEIVED,
          title: 'Lời mời tham gia Teamspace',
          message: `Bạn được mời tham gia Teamspace "${recipient.teamspace_name}".`,
          actionUrl: '/teamspaces/invitations',
          metadata: { invitationId: recipient.invitation_id, expiresAt: recipient.expires_at.toISOString() },
        });
      } else {
        this.mailService.assertConfigured();
        await this.mailService.sendTeamspaceInvitation({
          to: recipient.recipient_email,
          recipientName: recipient.recipient_name,
          inviterName: recipient.inviter_name ?? 'Một thành viên',
          teamspaceName: recipient.teamspace_name,
          workspaceName: recipient.workspace_name,
          invitationUrl: this.invitationUrl(),
          expiresAt: recipient.expires_at,
        });
      }
      await this.finish(delivery, 'COMPLETED');
    } catch (error) {
      const permanent = error instanceof UnsupportedDeliveryEvent;
      const message = error instanceof Error ? error.message : 'Unknown delivery failure';
      await this.fail(delivery, message, permanent);
    } finally {
      clearInterval(heartbeat);
    }
  }

  private async renewLease(delivery: ClaimedDelivery): Promise<boolean> {
    const rows = await this.dataSource.query<Array<{ id: string }>>(`
      UPDATE outbox_deliveries
      SET locked_until = now() + ($3::integer * interval '1 millisecond'), updated_at = now()
      WHERE id = $1 AND locked_by = $2 AND status = 'PROCESSING'
      RETURNING id
    `, [delivery.id, delivery.locked_by, this.lockTimeoutMs]);
    return rows.length === 1;
  }

  private invitationUrl(): string {
    const base = process.env.FRONTEND_URL?.trim() || process.env.CLIENT_URL?.trim();
    if (!base) throw new Error('FRONTEND_URL or CLIENT_URL is required for invitation email');
    const url = new URL(base);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) {
      throw new Error('Invalid frontend URL configuration');
    }
    return new URL('/teamspaces/invitations', url).toString();
  }

  private async resolveRecipient(invitationId: string): Promise<InvitationRecipient | null> {
    const rows = await this.dataSource.query<InvitationRecipient[]>(`
      SELECT invitation.id AS invitation_id, teamspace.id AS teamspace_id,
             teamspace.name AS teamspace_name, workspace.id AS workspace_id,
             workspace.name AS workspace_name, recipient.user_id AS recipient_user_id,
             recipient_user.email AS recipient_email,
             recipient_user.username AS recipient_name,
             inviter.id AS inviter_user_id, inviter.username AS inviter_name,
             invitation.expires_at
      FROM teamspace_invitations AS invitation
      JOIN teamspaces AS teamspace ON teamspace.id = invitation.teamspace_id AND teamspace.deleted_at IS NULL
      JOIN workspaces AS workspace ON workspace.id = teamspace.workspace_id AND workspace.deleted_at IS NULL
      JOIN workspace_members AS recipient ON recipient.id = invitation.workspace_member_id
        AND recipient.workspace_id = workspace.id AND recipient.membership_type = 'MEMBER'
      JOIN users AS recipient_user ON recipient_user.id = recipient.user_id
        AND recipient_user.deleted_at IS NULL AND recipient_user.is_active = true
      LEFT JOIN users AS inviter ON inviter.id = invitation.invited_by AND inviter.deleted_at IS NULL
      WHERE invitation.id = $1 AND invitation.status = 'PENDING' AND invitation.expires_at > now()
        AND NOT EXISTS (
          SELECT 1 FROM teamspace_members AS member
          WHERE member.teamspace_id = teamspace.id AND member.workspace_member_id = recipient.id
        )
    `, [invitationId]);
    return rows[0] ?? null;
  }

  private async finish(delivery: ClaimedDelivery, status: 'COMPLETED' | 'SKIPPED'): Promise<void> {
    await this.dataSource.query(`
      UPDATE outbox_deliveries SET status = $3, processed_at = now(),
        locked_by = NULL, locked_until = NULL, last_error = NULL, updated_at = now()
      WHERE id = $1 AND locked_by = $2 AND status = 'PROCESSING'
    `, [delivery.id, delivery.locked_by, status]);
  }

  private async fail(delivery: ClaimedDelivery, message: string, permanent: boolean): Promise<void> {
    const failed = permanent || delivery.attempt_count >= this.maxAttempts;
    const backoffMs = Math.min(3600000, 5000 * 2 ** Math.min(delivery.attempt_count - 1, 10));
    await this.dataSource.query(`
      UPDATE outbox_deliveries SET status = $3, last_error = $4,
        next_attempt_at = now() + ($5::integer * interval '1 millisecond'),
        locked_by = NULL, locked_until = NULL, updated_at = now()
      WHERE id = $1 AND locked_by = $2 AND status = 'PROCESSING'
    `, [delivery.id, delivery.locked_by, failed ? 'FAILED' : 'PENDING', message.slice(0, 1000), backoffMs]);
    this.logger.warn(`Outbox delivery ${delivery.id} ${failed ? 'failed permanently' : 'scheduled for retry'}: ${message}`);
  }
}
