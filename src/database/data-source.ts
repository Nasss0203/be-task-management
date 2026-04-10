import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { Board } from 'src/modules/boards/domain/entities/board.entity';
import { Page } from 'src/modules/page/domain/entities/page.entity';
import { PageBlock } from 'src/modules/page_block/domain/entities/page_block.entity';
import { Permission } from 'src/modules/permission/domain/entities/permission.entity';
import { Project } from 'src/modules/projects/domain/entities/project.entity';
import { RefreshToken } from 'src/modules/refresh_token/entities/refresh_token.entity';
import { Role } from 'src/modules/role/domain/entities/role.entity';
import { RolePermission } from 'src/modules/role_permission/domain/entities/role_permission.entity';
import { Sprint } from 'src/modules/sprints/entities/sprint.entity';
import { TaskPriority } from 'src/modules/task_priority/domain/entities/task_priority.entity';
import { TaskStatus } from 'src/modules/task_status/domain/entities/task_status.entity';
import { Task } from 'src/modules/tasks/domain/entities/task.entity';
import { UserProfile } from 'src/modules/user_profiles/entities/user_profile.entity';
import { UserRole } from 'src/modules/user_roles/domain/entities/user_role.entity';
import { UserWorkspace } from 'src/modules/user_workspace/domain/entities/user_workspace.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Workspace } from 'src/modules/workspaces/domain/entities/workspace.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  schema: 'public',
  synchronize: false,
  migrationsRun: false,
  logging: true,
  entities: [
    User,
    Workspace,
    Permission,
    Role,
    RolePermission,
    UserProfile,
    RefreshToken,
    UserWorkspace,
    UserRole,
    Page,
    PageBlock,
    Project,
    Sprint,
    Task,
    Board,
    TaskStatus,
    TaskPriority,
  ],
  migrations: ['src/database/migrations/*{.ts,.js}'],
});
