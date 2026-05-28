import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Socket } from 'socket.io';
import { SocketUser } from '../types/socket-user.type';

@Injectable()
export class RealtimeSocketAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async authenticate(client: Socket): Promise<SocketUser> {
    const token = this.extractToken(client);

    const payload = await this.jwtService.verifyAsync(token, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_TOKEN_SECRET'),
    });

    const userId = payload.sub || payload.id;

    if (!userId) {
      throw new UnauthorizedException();
    }

    return {
      id: userId,
      email: payload.email,
    };
  }

  private extractToken(client: Socket): string {
    const tokenFromAuth = client.handshake.auth?.token;

    if (tokenFromAuth) {
      return tokenFromAuth;
    }

    const authorization = client.handshake.headers.authorization;

    if (authorization?.startsWith('Bearer ')) {
      return authorization.replace('Bearer ', '');
    }

    throw new UnauthorizedException();
  }
}
