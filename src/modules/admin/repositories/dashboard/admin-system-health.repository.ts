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
      this.getConfigValue(['HOST_EMAIL', 'MAIL_HOST', 'SMTP_HOST']) ??
      'smtp.gmail.com';
    const user = this.getConfigValue(['USER_EMAIL', 'MAIL_USER', 'SMTP_USER']);
    const pass = this.getConfigValue([
      'PASSWORD_EMAIL',
      'MAIL_PASS',
      'SMTP_PASS',
    ])?.replace(/\s/g, '');

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

  private getConfigValue(keys: string[]): string | undefined {
    for (const key of keys) {
      const value = this.configService.get<string>(key)?.trim();

      if (value) {
        return value;
      }
    }

    return undefined;
  }
}
