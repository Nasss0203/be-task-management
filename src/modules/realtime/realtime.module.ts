import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationCreatedRealtimeListener } from './listeners/notification-created.listener';
import { TaskUpdatedRealtimeListener } from './listeners/task-updated.listener';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimeEmitterService } from './services/realtime-emitter.service';
import { RealtimeRoomsService } from './services/realtime-rooms.service';
import { RealtimeSocketAuthService } from './services/realtime-socket-auth.service';

@Module({
  imports: [JwtModule, ConfigModule],
  providers: [
    RealtimeGateway,
    RealtimeSocketAuthService,
    RealtimeRoomsService,
    RealtimeEmitterService,
    NotificationCreatedRealtimeListener,
    TaskUpdatedRealtimeListener,
  ],
})
export class RealtimeModule {}
