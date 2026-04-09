import { Permission } from 'src/modules/permission/entities/permission.entity';
import { Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Role } from '../../role/domain/entities/role.entity';

@Index('IDX_role_permissions_role', ['role_id'])
@Index('IDX_role_permissions_permission', ['permission_id'])
@Entity('role_permissions')
export class RolePermission {
  @PrimaryColumn('uuid')
  role_id: string;

  @PrimaryColumn('uuid')
  permission_id: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
