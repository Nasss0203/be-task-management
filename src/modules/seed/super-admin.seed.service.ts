import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { hashPassword } from 'src/utils';
import { Repository } from 'typeorm';
import { SystemRole, User } from '../users/domain/entities/user.entity';

@Injectable()
export class SuperAdminSeedService {
  private readonly logger = new Logger(SuperAdminSeedService.name);

  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async seed(): Promise<void> {
    const email = this.getRequiredConfig('SUPER_ADMIN_EMAIL').toLowerCase();
    const username = this.configService
      .get<string>('SUPER_ADMIN_USERNAME')
      ?.trim();
    const password = this.configService
      .get<string>('SUPER_ADMIN_PASSWORD')
      ?.trim();

    const existed = await this.userRepository.findOne({
      where: { email },
    });

    if (existed) {
      let shouldSave = false;

      if (existed.systemRole !== SystemRole.SUPER_ADMIN) {
        existed.systemRole = SystemRole.SUPER_ADMIN;
        shouldSave = true;
      }

      if (!existed.isActive) {
        existed.isActive = true;
        shouldSave = true;
      }

      if (!existed.passwordHash && password) {
        existed.passwordHash = hashPassword(password);
        shouldSave = true;
      }

      if (shouldSave) {
        await this.userRepository.save(existed);
        this.logger.log(`Updated super admin: ${email}`);
      } else {
        this.logger.log(`Super admin existed: ${email}`);
      }

      return;
    }

    if (!username) {
      throw new Error('SUPER_ADMIN_USERNAME is required to create super admin');
    }

    if (!password) {
      throw new Error('SUPER_ADMIN_PASSWORD is required to create super admin');
    }

    const usernameExisted = await this.userRepository.findOne({
      where: { username },
    });

    if (usernameExisted) {
      throw new Error(`SUPER_ADMIN_USERNAME is already used: ${username}`);
    }

    const user = this.userRepository.create({
      email,
      username,
      passwordHash: hashPassword(password),
      systemRole: SystemRole.SUPER_ADMIN,
      isActive: true,
      googleId: null,
      avatarUrl: null,
    });

    await this.userRepository.save(user);
    this.logger.log(`Seeded super admin: ${email}`);
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key)?.trim();

    if (!value) {
      throw new Error(`${key} is required`);
    }

    return value;
  }
}
