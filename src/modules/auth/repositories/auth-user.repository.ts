import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SystemRole, User } from 'src/modules/users/domain/entities/user.entity';
import { Repository, EntityManager } from 'typeorm';
import {
  AuthUserRepository,
  CreateGoogleAuthUserInput,
  CreateLocalAuthUserInput,
} from '../interfaces/repositories/auth-user.repository.interface';

@Injectable()
export class AuthUserRepositoryImpl implements AuthUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  findByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { googleId } });
  }

  findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<User | null> {
    return this.userRepo.findOne({
      where: [{ email }, { username }],
    });
  }

  findByEmailAndUsername(
    email: string,
    username: string,
  ): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email, username },
    });
  }

  findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { emailVerificationToken: token } });
  }

  findByResetPasswordToken(token: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { resetPasswordToken: token } });
  }

  findProfileById(id: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        googleId: true,
        avatarUrl: true,
        isActive: true,
        systemRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async createLocalUser(input: CreateLocalAuthUserInput, manager?: EntityManager): Promise<User> {
    const repo = manager ? manager.getRepository(User) : this.userRepo;
    const user = repo.create({
      email: input.email,
      username: input.username,
      passwordHash: input.passwordHash,
      systemRole: SystemRole.USER,
      isActive: true,
      isEmailVerified: false,
      emailVerificationToken: input.emailVerificationToken,
      emailVerificationExpires: input.emailVerificationExpires,
      googleId: null,
      avatarUrl: null,
    });

    return repo.save(user);
  }

  async createGoogleUser(input: CreateGoogleAuthUserInput): Promise<User> {
    const user = this.userRepo.create({
      email: input.email,
      username: input.username,
      googleId: input.googleId,
      avatarUrl: input.avatarUrl,
      passwordHash: null,
      isActive: true,
      isEmailVerified: true,
    });

    return this.userRepo.save(user);
  }

  save(user: User): Promise<User> {
    return this.userRepo.save(user);
  }
}
