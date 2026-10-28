import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '../identity/identity.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PermissionModule } from '../permission/permission.module';
import { ListMentionCandidatesHandler } from './application/queries/list-mention-candidates/list-mention-candidates.handler';
import { MentionCandidateService } from './application/services/mention-candidate.service';
import { SyncMentionsService } from './application/services/sync-mentions.service';
import { SqlMentionCandidateReader } from './infrastructure/persistence/typeorm/adapters/sql-mention-candidate-reader.adapter';
import { MentionOrmEntity } from './infrastructure/persistence/typeorm/entities/mention.orm-entity';
import { TypeOrmMentionRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-mention.repository';
import { MENTION_TYPES } from './mentions.types';
import { MentionController } from './presentation/http/controllers/mention.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([MentionOrmEntity]),
    forwardRef(() => IdentityModule),
    NotificationsModule,
    PermissionModule,
  ],
  controllers: [MentionController],
  providers: [
    {
      provide: MENTION_TYPES.repositories.MentionRepository,
      useClass: TypeOrmMentionRepository,
    },
    {
      provide: MENTION_TYPES.ports.MentionCandidateReader,
      useClass: SqlMentionCandidateReader,
    },
    MentionCandidateService,
    SyncMentionsService,
    ListMentionCandidatesHandler,
  ],
  exports: [MENTION_TYPES.repositories.MentionRepository, SyncMentionsService],
})
export class MentionsModule {}
