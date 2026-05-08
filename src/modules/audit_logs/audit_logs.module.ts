import { Module } from '@nestjs/common';
import { AuditLogsController } from './controller/audit_logs.controller';

@Module({
  controllers: [AuditLogsController],
  providers: [],
})
export class AuditLogsModule {}
