import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { compareSync } from 'bcrypt';
import { randomBytes } from 'crypto';
import { IAuth } from 'src/types/auth';
import { hashPassword, hashToken } from 'src/utils';
import { Repository } from 'typeorm';
import { RefreshToken } from '../refresh_token/entities/refresh_token.entity';
import { RegisterUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(RefreshToken)
    private refreshRepo: Repository<RefreshToken>,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const exists = await this.userRepo.findOne({
      where: [
        {
          email: registerUserDto.email,
        },
        {
          username: registerUserDto.username,
        },
      ],
    });

    if (exists)
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);

    const user = this.userRepo.create({
      ...registerUserDto,
      passwordHash: hashPassword(registerUserDto.password),
      isActive: true,
    });

    const saved = await this.userRepo.save(user);

    const { id, email, username } = saved;
    return { id, email, username };
  }

  async login(auth: IAuth) {
    const { email, username } = auth;
    const user = await this.userRepo.findOne({ where: { email, username } });

    if (!user || !user.isActive)
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);

    // Create workspaces

    const payload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      username: user.username,
      // tenantId,
      // permissions: permissionCodes,
    };

    const accessToken = this.jwt.sign(payload);

    const newRefreshToken = randomBytes(64).toString('hex');

    await this.refreshRepo.save({
      user_id: user.id,
      token: hashToken(newRefreshToken),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      access_token: accessToken,
      refresn_token: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);

    const stored = await this.refreshRepo.findOne({
      where: { token: tokenHash },
    });

    if (stored && !stored.revoked_at) {
      stored.revoked_at = new Date();
      await this.refreshRepo.save(stored);
    }

    return { success: true };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepo.findOne({
      where: { email },
    });
    if (user) {
      const isValid = this.comparePassword(password, user.passwordHash);
      if (isValid === true) {
        return user;
      }
    }
    return null;
  }
  comparePassword(password: string, hash: string) {
    return compareSync(password, hash);
  }
}
