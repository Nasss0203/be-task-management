import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { SystemHealthResponseDto } from '../../dto/response/dashboard/system-health.response.dto';
import { AdminSystemHealthRepository } from '../../interfaces/repositories/dashboard/admin-system-health.repository.interface';

@Injectable()
export class AdminSystemHealthRepositoryImpl implements AdminSystemHealthRepository {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async getSystemHealth(): Promise<SystemHealthResponseDto[]> {
    const databaseStatus = await this.checkDatabase();
    const mailStatus = this.checkMailService();

    return [
      {
        key: 'api',
        label: 'API Status',
        value: 'Healthy',
        level: 'success',
        description: 'Backend API is reachable.',
      },
      databaseStatus,
      mailStatus,
      {
        key: 'environment',
        label: 'Environment',
        value: this.configService.get<string>('NODE_ENV') ?? 'development',
        level: 'success',
        description: 'Current backend runtime environment.',
      },
    ];
  }

  private async checkDatabase(): Promise<SystemHealthResponseDto> {
    try {
      await this.dataSource.query('SELECT 1');

      return {
        key: 'database',
        label: 'Database Status',
        value: 'Healthy',
        level: 'success',
        description: 'Database connection is available.',
      };
    } catch {
      return {
        key: 'database',
        label: 'Database Status',
        value: 'Down',
        level: 'danger',
        description: 'Database connection failed.',
      };
    }
  }

  private checkMailService(): SystemHealthResponseDto {
    const host =
      this.configService.get<string>('MAIL_HOST') ??
      this.configService.get<string>('SMTP_HOST');

    const user =
      this.configService.get<string>('MAIL_USER') ??
      this.configService.get<string>('SMTP_USER');

    const pass =
      this.configService.get<string>('MAIL_PASS') ??
      this.configService.get<string>('SMTP_PASS');

    const isConfigured = Boolean(host && user && pass);

    return {
      key: 'mail',
      label: 'Mail Service',
      value: isConfigured ? 'Configured' : 'Not Configured',
      level: isConfigured ? 'success' : 'warning',
      description: isConfigured
        ? 'Mail service configuration is available.'
        : 'Mail service configuration is missing or incomplete.',
    };
  }
}
