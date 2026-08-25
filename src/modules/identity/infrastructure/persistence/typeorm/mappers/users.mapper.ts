import { User } from 'src/modules/identity/infrastructure/persistence/typeorm/entities/user.orm-entity';
import { UserModel } from 'src/modules/identity/domain/aggregates/user/user.model';
import { UserResponseDto } from 'src/modules/identity/application/dto/user/user-response.dto';

type SaveUserInput = Pick<UserModel, 'username' | 'email' | 'passwordHash'> &
  Partial<
    Pick<UserModel, 'updatedAt' | 'createdAt' | 'id' | 'deletedAt' | 'isActive'>
  >;

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
