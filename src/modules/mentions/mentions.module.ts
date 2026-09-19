import { Module } from '@nestjs/common';
import { MentionsController } from './presentation/http/controllers/mentions.controller';

@Module({
  controllers: [MentionsController],
  providers: [],
})
export class MentionsModule {}
