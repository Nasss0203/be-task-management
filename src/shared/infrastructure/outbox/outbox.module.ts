import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from 'src/modules/mail/mail.module';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import { OutboxDeliveryOrmEntity } from './outbox-delivery.orm-entity';
import { TEAMSPACE_INVITATION_DELIVERY_OUTBOX } from './teamspace-invitation-delivery.port';
import { TeamspaceInvitationDeliveryProcessor } from './teamspace-invitation-delivery.processor';
import { TypeOrmTeamspaceInvitationDeliveryOutbox } from './typeorm-teamspace-invitation-delivery-outbox';

@Module({
  imports: [TypeOrmModule.forFeature([OutboxDeliveryOrmEntity]), NotificationsModule, MailModule],
  providers: [
    { provide: TEAMSPACE_INVITATION_DELIVERY_OUTBOX, useClass: TypeOrmTeamspaceInvitationDeliveryOutbox },
    TeamspaceInvitationDeliveryProcessor,
  ],
  exports: [TEAMSPACE_INVITATION_DELIVERY_OUTBOX],
})
export class OutboxModule {}
