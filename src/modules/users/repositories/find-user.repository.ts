import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../domain/entities/user.entity';
import { UserModel } from '../domain/models/user.model';
import { FindUserRepository } from '../interfaces/repositories/find-user.repository.interface';
import { UserMapper } from '../mapper/users.mapper';

@Injectable()
export class FindUserRepositoryImpl implements FindUserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repoUser: Repository<User>,
  ) {}

  async findUserByUsername(username: string): Promise<UserModel | null> {
    const user = await this.repoUser.findOne({
      where: { username },
    });

    return user ? UserMapper.toModel(user) : null;
  }
  async findUserByEmail(email: string): Promise<UserModel | null> {
    const user = await this.repoUser.findOne({
      where: { email },
    });

    return user ? UserMapper.toModel(user) : null;
  }
  async findUserById(id: string): Promise<UserModel | null> {
    const user = await this.repoUser.findOne({
      where: { id },
    });

    return user ? UserMapper.toModel(user) : null;
  }

  async searchUsers(keyword: string): Promise<any[]> {
    const trimmedKeyword = keyword.trim();

    if (!trimmedKeyword) return [];

    return this.repoUser
      .createQueryBuilder('u')
      .leftJoin('user_profiles', 'up', 'up.user_id = u.id')
      .where('u.username ILIKE :keyword', { keyword: `%${trimmedKeyword}%` })
      .orWhere('u.email ILIKE :keyword', { keyword: `%${trimmedKeyword}%` })
      .orWhere('up.full_name ILIKE :keyword', {
        keyword: `%${trimmedKeyword}%`,
      })
      .select([
        'u.id as id',
        'u.username as username',
        'u.email as email',
        'up.full_name as full_name',
        'up.avatar_url as avatar_url',
      ])
      .limit(10)
      .getRawMany();
  }
}
