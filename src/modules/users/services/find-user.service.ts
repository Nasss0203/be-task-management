import { Inject, Injectable } from '@nestjs/common';
import { UserModel } from '../domain/models/user.model';
import { type FindUserRepository } from '../interfaces/repositories/find-user.repository.interface';
import { FindUserService } from '../interfaces/services/find-user.service.interface';
import { USER_TYPES } from '../interfaces/types';

@Injectable()
export class FindUserServiceImpl implements FindUserService {
  constructor(
    @Inject(USER_TYPES.repositories.FindUserRepository)
    private readonly findUserRepository: FindUserRepository,
  ) {}

  findUserByUsername(username: string): Promise<UserModel | null> {
    return this.findUserRepository.findUserByUsername(username);
  }

  findUserByEmail(email: string): Promise<UserModel | null> {
    return this.findUserRepository.findUserByEmail(email);
  }

  findUserById(id: string): Promise<UserModel | null> {
    return this.findUserRepository.findUserById(id);
  }

  searchUsers(keyword: string): Promise<UserModel[]> {
    return this.findUserRepository.searchUsers(keyword);
  }
}
