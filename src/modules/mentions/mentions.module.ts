import { Module } from '@nestjs/common';
import { MentionsController } from './controller/mentions.controller';

@Module({
  controllers: [MentionsController],
  providers: [],
})
export class MentionsModule {}
