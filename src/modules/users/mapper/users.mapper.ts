import { User } from '../domain/entities/user.entity';
import { UserModel } from '../domain/models/user.model';
import { UserResponseDto } from '../dto/response/user-response.dto';
import { SaveUserInput } from '../interfaces/repositories/create-user.repository.interface';

export class UserMapper {
  static toModel(entity: User): UserModel {
    return new UserModel(
      entity.id,
      entity.email,
      entity.username,
      entity.passwordHash,
      entity.isActive,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt,
    );
  }

  static toEntity(model: UserModel | SaveUserInput): User {
    const e = new User();

    if (model.id != null) e.id = model.id;
    e.email = model.email;
    e.username = model.username;

    if ('passwordHash' in model && model.passwordHash != null) {
      e.passwordHash = model.passwordHash;
    }

    if (model.isActive != null) e.isActive = model.isActive;
    if (model.createdAt != null) e.createdAt = model.createdAt;
    if (model.updatedAt != null) e.updatedAt = model.updatedAt;
    if (model.deletedAt !== undefined) e.deletedAt = model.deletedAt;

    return e;
  }

  static toResponse(model: UserModel): UserResponseDto {
    return {
      id: model.id,
      email: model.email,
      username: model.username,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      deletedAt: model.deletedAt,
    };
  }
}
