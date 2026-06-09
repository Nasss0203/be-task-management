# API Catalog

This catalog is generated from the NestJS controller source in `src/app.controller.ts` and `src/modules/**/controller/**/*.ts`.

## Conventions

- Base path: `/api/v1`
- Unless marked `Public`, requests pass through the global `JwtAuthGuard`.
- `FeatureGuard`, `PermissionGuard`, and `SystemRoleGuard` are registered globally, but only enforce rules when route metadata is present.
- `Response format` uses the global `TransformInterceptor` unless `@SkipTransform()` is present.

### Standard Success Response

```json
{
  "statusCode": 200,
  "message": "Route-specific response message or empty string",
  "data": {}
}
```

### Standard Error Response

```json
{
  "statusCode": 400,
  "code": "BAD_REQUEST",
  "message": "Error message",
  "path": "/api/v1/example",
  "timestamp": "2026-06-05T00:00:00.000Z"
}
```

### Guard Legend

| Label | Meaning |
| --- | --- |
| `Public` | `@Public()` skips global JWT authentication |
| `JWT` | Global `JwtAuthGuard` |
| `LocalAuthGuard` | Passport local strategy login guard |
| `GoogleAuthGuard` | Passport Google OAuth guard |
| `PermissionGuard` | Enforces `@RequirePermissions(...)` metadata |
| `FeatureGuard` | Enforces `@RequireFeature(...)` metadata |
| `SystemRoleGuard` | Enforces `@RequireSystemRoles(...)` metadata |

## Endpoints

### App

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1` | `AppController.getHello` | none | JWT | none | Wrapped `string` | none |

### Auth

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | `AuthController.register` | Body: `RegisterUserDto` | Public | none | Wrapped auth/register result | `User`, default `Workspace`, RBAC bootstrap entities |
| POST | `/api/v1/auth/login` | `AuthController.login` | Body consumed by `LocalStrategy` credentials | Public, `LocalAuthGuard` | none | Wrapped `{ access_token, refresh_token }`; sets `refresh_token` cookie | `User`, `RefreshToken` |
| POST | `/api/v1/auth/refresh` | `AuthController.refresh` | Body: `{ refresh_token?: string }`; cookie: `refresh_token` | Public | none | Wrapped `{ access_token, refresh_token }`; rotates cookie | `RefreshToken`, `User` |
| POST | `/api/v1/auth/logout` | `AuthController.logout` | Body: `{ refresh_token?: string }`; cookie: `refresh_token` | Public | none | Wrapped logout result; clears cookie | `RefreshToken` |
| GET | `/api/v1/auth/google` | `AuthController.googleAuth` | none | Public, `GoogleAuthGuard` | none | OAuth redirect/challenge | `User` through Google OAuth |
| GET | `/api/v1/auth/google/callback` | `AuthController.googleAuthCallback` | Google OAuth callback payload | Public, `GoogleAuthGuard` | none | Raw redirect because `@SkipTransform()`; sets `refresh_token` cookie | `User`, `RefreshToken`, default `Workspace` for new users |
| GET | `/api/v1/auth/me` | `AuthController.getProfile` | JWT request user | JWT | none | Wrapped user profile result | `User` |

### Workspaces

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/workspaces/default` | `WorkspacesController.create` | Body: `CreateWorkspaceDto` | JWT | none | Wrapped workspace creation result | `Workspace`, `UserWorkspace`, `Role`, `Permission`, `RolePermission`, `UserRole`, `Page`, `Project`, `Board`, `TaskStatus`, `TaskPriority`, `Task`, `UsageLimit` |
| POST | `/api/v1/workspaces` | `WorkspacesController.createByTemplate` | Body: `CreateWorkspaceTemplateDto` | JWT | none | Wrapped workspace template result | `Workspace`, template-derived project/page data |
| GET | `/api/v1/workspaces` | `WorkspacesController.findAllWorkspace` | none | JWT | none | Wrapped workspace list | `Workspace`, `UserWorkspace` |
| GET | `/api/v1/workspaces/trash` | `WorkspacesController.findDeletedWorkspaces` | none | JWT | none | Wrapped deleted workspace list | `Workspace` |
| GET | `/api/v1/workspaces/:workspaceId` | `WorkspacesController.findOneWorkspaceById` | Params: `workspaceId` | JWT, `PermissionGuard` | `WORKSPACE_READ` | Wrapped workspace | `Workspace`, `UserWorkspace`, RBAC entities |
| GET | `/api/v1/workspaces/:workspaceId/overview` | `WorkspacesController.findOverview` | Params: `workspaceId` | JWT, `PermissionGuard` | `WORKSPACE_READ` | Wrapped `WorkspaceOverviewResponseDto` | `Workspace`, `Project`, `Board`, `Task`, `Sprint`, `UserWorkspace` |
| GET | `/api/v1/workspaces/:workspaceId/access` | `WorkspacesController.getWorkspaceAccess` | Params: `workspaceId` | JWT, `PermissionGuard` | `WORKSPACE_READ` | Wrapped workspace access result | `Workspace`, `Role`, `Permission`, `UserRole` |
| PATCH | `/api/v1/workspaces/:workspaceId/layout-mode` | `WorkspacesController.updateLayoutMode` | Body: `UpdateWorkspaceLayoutModeDto`; Params: `workspaceId` | JWT, `PermissionGuard` | `WORKSPACE_UPDATE` | Wrapped updated workspace/layout result | `Workspace` |
| DELETE | `/api/v1/workspaces/:workspaceId` | `WorkspacesController.softDeleteWorkspace` | Params: `workspaceId` | JWT, `PermissionGuard` | `WORKSPACE_DELETE` | Wrapped deleted workspace result | `Workspace` |
| PATCH | `/api/v1/workspaces/:workspaceId/restore` | `WorkspacesController.restoreWorkspace` | Params: `workspaceId` | JWT, `PermissionGuard` | `WORKSPACE_DELETE` | Wrapped restored workspace result | `Workspace` |

### Workspace Members

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/workspace-members/:workspaceId/members` | `UserWorkspacesController.addMember` | Body: `AddWorkspaceMemberDto`; Params: `workspaceId` | JWT, `PermissionGuard` | `WORKSPACE_MEMBER_ADD` | Wrapped member add result | `UserWorkspace`, `UserRole`, `Role`, `Activity` |
| GET | `/api/v1/workspace-members/:workspaceId/members` | `UserWorkspacesController.findAllMember` | Params: `workspaceId` | JWT, `PermissionGuard` | `WORKSPACE_MEMBER_READ` | Wrapped `MemberWorkspaceResponseDto[]` | `UserWorkspace`, `User`, `Role`, `UserRole` |

### Workspace Invites

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/workspace-invites/:workspaceId/members` | `WorkspaceInvitesController.invite` | Body: `CreateWorkspaceInviteDto`; Params: `workspaceId` | JWT, `PermissionGuard` | `WORKSPACE_MEMBER_ADD` | Wrapped `WorkspaceInviteResponseDto[]` | `WorkspaceInvite`, `Workspace`, `User`, `Role`, `Notification` |
| POST | `/api/v1/workspace-invites/:token/accept` | `WorkspaceInvitesController.acceptInvite` | Params: `token` | JWT | none | Wrapped `WorkspaceInviteResponseDto` | `WorkspaceInvite`, `UserWorkspace`, `UserRole`, `Notification` |
| POST | `/api/v1/workspace-invites/:workspaceId/link` | `WorkspaceInvitesController.createInviteLink` | Body: `CreateWorkspaceInviteLinkDto`; Params: `workspaceId` | JWT, `PermissionGuard` | `WORKSPACE_MEMBER_ADD` | Wrapped `WorkspaceInviteLinkResponseDto` | `WorkspaceInvite`, `Workspace` |
| GET | `/api/v1/workspace-invites/:workspaceId/users/search?q=` | `WorkspaceInvitesController.searchInviteUsers` | Query: `q`; Params: `workspaceId` | JWT, `PermissionGuard` | `WORKSPACE_MEMBER_ADD` | Wrapped `SearchInviteUserResponseDto[]` | `User`, `UserWorkspace`, `WorkspaceInvite` |

### Projects

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/projects/workspace/:workspaceId` | `ProjectsController.findAllByWorkspaceId` | Params: `workspaceId` | JWT, `PermissionGuard` | `PROJECT_READ` | Wrapped project list | `Project`, `Workspace` |
| POST | `/api/v1/projects` | `ProjectsController.createProjectWithPageBlock` | Body: `CreateProjectDto` | JWT, `PermissionGuard` | `PROJECT_CREATE` | Wrapped project creation result | `Project`, `Board`, `TaskStatus`, `TaskPriority`, `Task`, `PageBlock`, `Activity`, `UsageLimit` |
| GET | `/api/v1/projects/trash?workspaceId=` | `ProjectsController.findDeletedProjects` | Query: `workspaceId` | JWT, `PermissionGuard` | `PROJECT_READ` | Wrapped deleted project list | `Project` |
| DELETE | `/api/v1/projects/workspaces/:workspaceId/projects/:projectId` | `ProjectsController.deleteProject` | Params: `workspaceId`, `projectId` | JWT, `PermissionGuard` | `PROJECT_DELETE` | Wrapped `{ success: true }` | `Project`, `Activity` |
| PATCH | `/api/v1/projects/workspaces/:workspaceId/projects/:projectId/restore` | `ProjectsController.restoreProject` | Params: `workspaceId`, `projectId` | JWT, `PermissionGuard` | `PROJECT_DELETE` | Wrapped `{ success: true }` | `Project`, `Activity` |

### Boards

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/boards/trash?workspaceId=&projectId=` | `BoardsController.findDeletedBoards` | Query: `workspaceId`, optional `projectId` | JWT, `PermissionGuard` | `BOARD_READ` | Wrapped deleted board list | `Board` |
| GET | `/api/v1/boards/:id` | `BoardsController.findById` | Params: `id` | JWT | none | Wrapped `BoardResponseDto` | `Board` |
| GET | `/api/v1/boards/workspace/:workspaceId/project/:projectId` | `BoardsController.findAllByProjectId` | Params: `workspaceId`, `projectId` | JWT, `PermissionGuard` | `BOARD_READ` | Wrapped `BoardResponseDto[]` | `Board`, `Project`, `Workspace` |
| POST | `/api/v1/boards` | `BoardsController.create` | Body: `CreateBoardDto` | JWT, `PermissionGuard` | `BOARD_CREATE` | Wrapped board creation result | `Board`, `Project`, `Workspace` |
| POST | `/api/v1/boards/create-and-attach` | `BoardsController.createAndAttachToPage` | Body: `CreateBoardAndAttachDto` | JWT, `PermissionGuard` | `BOARD_CREATE`, `PAGE_BLOCK_UPDATE` | Wrapped `BoardResponseDto` | `Board`, `PageBlock`, `Project`, `Workspace` |
| DELETE | `/api/v1/boards/workspaces/:workspaceId/projects/:projectId/boards/:boardId` | `BoardsController.deleteBoard` | Params: `workspaceId`, `projectId`, `boardId` | JWT, `PermissionGuard` | `BOARD_DELETE` | Wrapped `{ success: true }` | `Board`, `Activity` |
| PATCH | `/api/v1/boards/workspaces/:workspaceId/projects/:projectId/boards/:boardId/restore` | `BoardsController.restoreBoard` | Params: `workspaceId`, `projectId`, `boardId` | JWT, `PermissionGuard` | `BOARD_DELETE` | Wrapped `{ success: true }` | `Board`, `Activity` |

### Pages

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/page` | `PageController.create` | Body: `CreatePageDto` | JWT, `PermissionGuard` | `PAGE_CREATE` | Wrapped page creation result | `Page`, `Workspace` |
| GET | `/api/v1/page/workspace/:workspaceId` | `PageController.findAll` | Params: `workspaceId` | JWT, `PermissionGuard` | `PAGE_READ` | Wrapped page list | `Page`, `PageBlock`, `Workspace` |
| GET | `/api/v1/page/trash?workspaceId=` | `PageController.findDeletedPages` | Query: `workspaceId` | JWT, `PermissionGuard` | `PAGE_READ` | Wrapped deleted page list | `Page` |
| PATCH | `/api/v1/page/:pageId` | `PageController.updatePage` | Body: `UpdatePageDto`; Params: `pageId` | JWT, `PermissionGuard` | `PAGE_UPDATE` | Wrapped updated page | `Page` |
| DELETE | `/api/v1/page/:pageId?workspaceId=` | `PageController.deletePage` | Query: `workspaceId`; Params: `pageId` | JWT, `PermissionGuard` | `PAGE_DELETE` | Wrapped `{ success: true }` | `Page`, `Activity` |
| PATCH | `/api/v1/page/:pageId/restore?workspaceId=` | `PageController.restorePage` | Query: `workspaceId`; Params: `pageId` | JWT, `PermissionGuard` | `PAGE_DELETE` | Wrapped `{ success: true }` | `Page`, `Activity` |

### Page Blocks

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/pageBlock` | `PageBlockController.create` | Body: `CreatePageBlockDto` | JWT, `PermissionGuard` | `PAGE_BLOCK_CREATE` | Wrapped `PageBlockResponseDto` | `PageBlock`, `Page` |
| GET | `/api/v1/pageBlock/page/:pageId` | `PageBlockController.findAllByPageId` | Params: `pageId` | JWT, `PermissionGuard` | `PAGE_BLOCK_READ` | Wrapped `PageBlockResponseDto[]` | `PageBlock`, `Page` |
| PATCH | `/api/v1/pageBlock/reorder` | `PageBlockController.reorder` | Body: `ReorderPageBlockDto` | JWT, `PermissionGuard` | `PAGE_BLOCK_UPDATE` | Wrapped `PageBlockResponseDto[]` | `PageBlock` |
| PATCH | `/api/v1/pageBlock/:id` | `PageBlockController.update` | Body: `UpdatePageBlockDto`; Params: `id` | JWT, `PermissionGuard` | `PAGE_BLOCK_UPDATE` | Wrapped updated page block | `PageBlock` |
| POST | `/api/v1/pageBlock/:blockId/database-views` | `PageBlockController.addDatabaseViewToBlock` | Body: `AddDatabaseViewToBlockDto`; Params: `blockId` | JWT, `PermissionGuard` | `PAGE_BLOCK_UPDATE` | Wrapped `PageBlockResponseDto` | `PageBlock`, `Project`, `Board` through `data_config` |
| GET | `/api/v1/pageBlock/trash?workspaceId=&pageId=` | `PageBlockController.findDeletedPageBlocks` | Query: `workspaceId`, optional `pageId` | JWT, `PermissionGuard` | `PAGE_BLOCK_READ` | Wrapped deleted page block list | `PageBlock` |
| DELETE | `/api/v1/pageBlock/:blockId?workspaceId=` | `PageBlockController.deletePageBlock` | Query: `workspaceId`; Params: `blockId` | JWT, `PermissionGuard` | `PAGE_BLOCK_DELETE` | Wrapped `{ success: true }` | `PageBlock`, `Activity` |
| PATCH | `/api/v1/pageBlock/:blockId/restore?workspaceId=` | `PageBlockController.restorePageBlock` | Query: `workspaceId`; Params: `blockId` | JWT, `PermissionGuard` | `PAGE_BLOCK_DELETE` | Wrapped `{ success: true }` | `PageBlock`, `Activity` |

### Tasks

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/tasks/workspace/:workspaceId/project/:projectId` | `TasksController.findAllByTask` | Params: `workspaceId`, `projectId` | JWT, `PermissionGuard` | `TASK_READ` | Wrapped `TaskResponseDto[]` | `Task`, `Project`, `Workspace`, `Board`, `Sprint`, `TaskStatus`, `TaskPriority`, `TaskAssignee` |
| GET | `/api/v1/tasks/workspace/:workspaceId/project/:projectId/backlog` | `TasksController.findAllBacklogTask` | Query: `FindBacklogTasksQueryDto`; Params: `workspaceId`, `projectId` | JWT, `FeatureGuard`, `PermissionGuard` | Feature: `SPRINT_ENABLED`; permission: `TASK_READ` | Wrapped `PaginatedTaskResponseDto` | `Task`, `Sprint`, `Project`, `Workspace` |
| POST | `/api/v1/tasks` | `TasksController.create` | Body: `CreateTaskDto` | JWT, `PermissionGuard` | `TASK_CREATE` | Wrapped task creation result | `Task`, `TaskAssignee`, `TaskComment`, `Activity`, `Notification` |
| PATCH | `/api/v1/tasks/:id` | `TasksController.updateTask` | Body: `UpdateTaskDto`; Params: `id` | JWT, `PermissionGuard` | `TASK_UPDATE` | Wrapped `TaskResponseDto` | `Task`, `Activity` |
| PATCH | `/api/v1/tasks/:id/move-sprint` | `TasksController.moveTaskToSprint` | Body: `MoveTaskSprintDto`; Params: `id` | JWT, `FeatureGuard`, `PermissionGuard` | Feature: `SPRINT_ENABLED`; permission: `TASK_UPDATE` | Wrapped `TaskResponseDto` | `Task`, `Sprint`, `Activity` |
| DELETE | `/api/v1/tasks/:taskId?workspaceId=` | `TasksController.deleteTask` | Query: `workspaceId`; Params: `taskId` | JWT, `PermissionGuard` | `TASK_DELETE` | Wrapped `{ success: true }` | `Task`, `Activity` |
| PATCH | `/api/v1/tasks/:taskId/restore?workspaceId=` | `TasksController.restoreTask` | Query: `workspaceId`; Params: `taskId` | JWT, `PermissionGuard` | `TASK_DELETE` | Wrapped `{ success: true }` | `Task`, `Activity` |
| GET | `/api/v1/tasks/trash?workspaceId=&projectId=` | `TasksController.findDeletedTasks` | Query: `workspaceId`, optional `projectId` | JWT, `PermissionGuard` | `TASK_READ` | Wrapped deleted task list | `Task` |
| PATCH | `/api/v1/tasks/:taskId/remove-sprint` | `TasksController.removeTaskFromSprint` | Params: `taskId` | JWT, `FeatureGuard`, `PermissionGuard` | Feature: `SPRINT_ENABLED`; permission: `TASK_UPDATE` | Wrapped `TaskResponseDto` | `Task`, `Sprint`, `Activity` |
| PATCH | `/api/v1/tasks/workspaces/:workspaceId/projects/:projectId/sprints/:sourceSprintId/tasks/:taskId/move-to-sprint` | `TasksController.moveTaskSprintToSprint` | Body: `MoveTaskSprintToSprintDto`; Params: `workspaceId`, `projectId`, `sourceSprintId`, `taskId` | JWT, `FeatureGuard`, `PermissionGuard` | Feature: `SPRINT_ENABLED`; permission: `TASK_UPDATE` | Wrapped task move result | `Task`, `Sprint`, `Activity` |
| PATCH | `/api/v1/tasks/workspaces/:workspaceId/projects/:projectId/bulk-update` | `TasksController.updateManyTasks` | Body: `UpdateManyTasksDto`; Params: `workspaceId`, `projectId` | JWT, `PermissionGuard` | `TASK_UPDATE` | Wrapped bulk update result | `Task` |

### Task Assignees

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/task-assignee` | `TaskAssigneeController.assignTask` | Body: `CreateTaskAssigneeDto` | JWT | none | Wrapped task assignment result | `TaskAssignee`, `Task`, `User`, `Activity`, `Notification` |
| DELETE | `/api/v1/task-assignee/task/:taskId/user/:userId` | `TaskAssigneeController.unassignTask` | Params: `taskId`, `userId` | JWT | none | Wrapped unassign result | `TaskAssignee`, `Task`, `User`, `Activity` |

### Task Comments

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/task-commnent/workspaces/:workspaceId/projects/:projectId/tasks/:taskId` | `TaskCommnentController.create` | Body: `CreateTaskCommnentDto`; Params: `workspaceId`, `projectId`, `taskId` | JWT, `PermissionGuard` | `TASK_COMMENT_CREATE` | Wrapped task comment result | `TaskComment`, `Task`, `User`, `Activity`, `Mention` |
| GET | `/api/v1/task-commnent/workspaces/:workspaceId/projects/:projectId/tasks/:taskId` | `TaskCommnentController.findByTaskId` | Params: `workspaceId`, `projectId`, `taskId` | JWT, `PermissionGuard` | `TASK_COMMENT_READ` | Wrapped task comments list | `TaskComment`, `Task`, `User`, `Mention` |

### Task Statuses

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/task-status/workspace/:workspaceId/project/:projectId` | `TaskStatusController.findAll` | Params: `workspaceId`, `projectId` | JWT, `PermissionGuard` | `TASK_STATUS_READ` | Wrapped task status list | `TaskStatus`, `Project`, `Workspace` |

### Task Priorities

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/task-priority/workspaces/:workspaceId/projects/:projectId` | `TaskPriorityController.findAllTaskPriority` | Params: `workspaceId`, `projectId` | JWT, `PermissionGuard` | `TASK_PRIORITY_READ` | Wrapped `TaskPriorityResponseDto[]` | `TaskPriority`, `Project`, `Workspace` |
| GET | `/api/v1/task-priority/workspaces/:workspaceId/projects/:projectId/done` | `TaskPriorityController.findDonePriority` | Params: `workspaceId`, `projectId` | JWT, `PermissionGuard` | `TASK_PRIORITY_READ` | Wrapped `TaskPriorityResponseDto \| null` | `TaskPriority`, `Project`, `Workspace` |

### Sprints

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/sprints/workspaces/:workspaceId/projects/:projectId` | `SprintsController.create` | Body: `CreateSprintDto`; Params: `workspaceId`, `projectId` | JWT, `FeatureGuard`, `PermissionGuard` | Feature: `SPRINT_ENABLED`; permission: `SPRINT_CREATE` | Wrapped sprint creation result | `Sprint`, `Project`, `Workspace`, `Activity` |
| GET | `/api/v1/sprints/workspaces/:workspaceId/projects/:projectId` | `SprintsController.findAllSprintByProject` | Query: `FindSprintQueryDto`; Params: `workspaceId`, `projectId` | JWT, `PermissionGuard` | `SPRINT_READ` | Wrapped `SprintResponseDto[]` | `Sprint`, `Project`, `Workspace` |
| GET | `/api/v1/sprints/workspaces/:workspaceId/projects/:projectId/sprints/:sprintId/tasks` | `SprintsController.findTasksBySprint` | Params: `workspaceId`, `projectId`, `sprintId` | JWT, `PermissionGuard` | `SPRINT_READ`, `TASK_READ` | Wrapped `SprintResponseDto` | `Sprint`, `Task`, `Project`, `Workspace` |
| GET | `/api/v1/sprints/workspaces/:workspaceId/projects/:projectId/sprint/:sprintId/detail` | `SprintsController.getSprintDetail` | Params: `workspaceId`, `projectId`, `sprintId` | JWT, `PermissionGuard` | `SPRINT_READ` | Wrapped `SprintResponseDto` | `Sprint`, `Task`, `Project`, `Workspace` |
| PATCH | `/api/v1/sprints/workspaces/:workspaceId/projects/:projectId/sprints/:sprintId/start` | `SprintsController.startSprint` | Body: `StartSprintDto`; Params: `workspaceId`, `projectId`, `sprintId` | JWT, `FeatureGuard`, `PermissionGuard` | Feature: `SPRINT_ENABLED`; permission: `SPRINT_START` | Wrapped `SprintResponseDto` | `Sprint`, `Activity` |
| PATCH | `/api/v1/sprints/workspaces/:workspaceId/projects/:projectId/sprints/:sprintId/complete` | `SprintsController.completeSprint` | Params: `workspaceId`, `projectId`, `sprintId` | JWT, `FeatureGuard`, `PermissionGuard` | Feature: `SPRINT_ENABLED`; permission: `SPRINT_COMPLETE` | Wrapped `SprintResponseDto` | `Sprint`, `Task`, `TaskStatus`, `Activity` |
| PATCH | `/api/v1/sprints/workspaces/:workspaceId/projects/:projectId/sprints/:sprintId/cancel` | `SprintsController.cancelSprint` | Params: `workspaceId`, `projectId`, `sprintId` | JWT, `FeatureGuard`, `PermissionGuard` | Feature: `SPRINT_ENABLED`; permission: `SPRINT_CANCEL` | Wrapped `SprintResponseDto` | `Sprint`, `Task`, `Activity` |
| PATCH | `/api/v1/sprints/workspaces/:workspaceId/projects/:projectId/sprint/:sprintId` | `SprintsController.updateSprint` | Body: `UpdateSprintDto`; Params: `workspaceId`, `projectId`, `sprintId` | JWT, `FeatureGuard`, `PermissionGuard` | Feature: `SPRINT_ENABLED`; permission: `SPRINT_UPDATE` | Wrapped `SprintResponseDto` | `Sprint`, `Activity` |
| GET | `/api/v1/sprints/workspaces/:workspaceId/projects/:projectId/sprints/:sprintId/progress` | `SprintsController.getSprintProgress` | Params: `workspaceId`, `projectId`, `sprintId` | JWT, `PermissionGuard` | `SPRINT_READ` | Wrapped `SprintProgressResponseDto` | `Sprint`, `Task`, `TaskStatus` |

### Attachments

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/attachment/upload` | `AttachmentController.upload` | Multipart body: `UploadAttachmentDto`; file field: `file` | JWT, `PermissionGuard`; `FileInterceptor` | `ATTACHMENT_UPLOAD` | Wrapped upload result | `Attachment`, `Task`, `User`, storage object |
| GET | `/api/v1/attachment/tasks/:taskId` | `AttachmentController.findByTask` | Params: `taskId` | JWT | none | Wrapped attachment list | `Attachment`, `Task` |
| POST | `/api/v1/attachment/:id/download-url` | `AttachmentController.createDownloadUrl` | Params: `id` | JWT | none | Wrapped download URL result | `Attachment`, storage object, `User` |

### Activity

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/activity/workspaces/:workspaceId` | `ActivityController.findByWorkspace` | Query: `FindActivityQueryDto`; Params: `workspaceId` | JWT, `PermissionGuard` | `ACTIVITY_READ` | Wrapped workspace activity list | `Activity`, `Workspace`, `User` |
| GET | `/api/v1/activity/workspaces/:workspaceId/projects/:projectId` | `ActivityController.findByProject` | Query: `FindActivityQueryDto`; Params: `workspaceId`, `projectId` | JWT, `PermissionGuard` | `ACTIVITY_READ` | Wrapped project activity list | `Activity`, `Project`, `Workspace`, `User` |
| GET | `/api/v1/activity/workspaces/:workspaceId/entities/:entityType/:entityId` | `ActivityController.findByEntity` | Query: `FindActivityQueryDto`; Params: `workspaceId`, `entityType`, `entityId` | JWT, `PermissionGuard` | `ACTIVITY_READ` | Wrapped entity activity list | `Activity` plus target entity |

### Notifications

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/notifications` | `NotificationsController.findMyNotifications` | Query: `QueryNotificationDto` | JWT | none | Wrapped notification page/list | `Notification`, `User`, optional source entities |
| GET | `/api/v1/notifications/unread-count` | `NotificationsController.countUnread` | none | JWT | none | Wrapped unread count | `Notification`, `User` |

### Dashboard

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/dashboard/me` | `DashboardController.getMyDashboard` | Query: `MyDashboardQueryDto` | JWT | none | Wrapped `MyDashboardResponseDto` | `User`, `Workspace`, `Task`, `Notification`, `Activity` |

### Billing and Plans

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/billing/payments` | `BillingController.createPayment` | Body: `CreatePaymentDto` | JWT, `PermissionGuard` | `WORKSPACE_BILLING_MANAGE` | Wrapped payment creation/payment URL result | `Payment`, `Plan`, `Subscription`, `Workspace` |
| GET | `/api/v1/billing/current-subscription` | `BillingController.getCurrentSubscription` | JWT request user | JWT | none | Wrapped current subscription result | `Subscription`, `Plan`, `SubscriptionWorkspace`, `Workspace` |
| GET | `/api/v1/billing/plans` | `PlanController.getPlans` | none | JWT | none | Wrapped billing plan list | `Plan`, `PlanFeature`, `Feature` |
| GET | `/api/v1/billing/plans/:planId` | `PlanController.getPlanById` | Params: `planId` | JWT | none | Wrapped billing plan | `Plan`, `PlanFeature`, `Feature` |
| GET | `/api/v1/workspaces/:workspaceId/usage-limits` | `WorkspaceUsageLimitsController.getWorkspaceUsageLimits` | Params: `workspaceId` | JWT, `PermissionGuard` | `WORKSPACE_USAGE_READ` | Wrapped workspace usage limits | `UsageLimit`, `Workspace`, `Subscription` |
| GET | `/api/v1/admin/billing/plans` | `AdminBillingController.getPlans` | none | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped admin billing plan list | `Plan`, `Subscription` |
| POST | `/api/v1/admin/billing/plans` | `AdminBillingController.createPlan` | Body: `AdminCreatePlanDto` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped admin billing plan | `Plan` |
| PATCH | `/api/v1/admin/billing/plans/:planId` | `AdminBillingController.updatePlan` | Body: `AdminUpdatePlanDto`; Params: `planId` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped admin billing plan | `Plan` |
| PATCH | `/api/v1/admin/billing/plans/:planId/status` | `AdminBillingController.updatePlanStatus` | Body: `AdminUpdatePlanStatusDto`; Params: `planId` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped admin billing plan | `Plan` |
| GET | `/api/v1/admin/billing/subscriptions` | `AdminBillingController.getSubscriptions` | none | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped admin subscription list | `Subscription`, `SubscriptionWorkspace`, `Workspace`, `Plan`, `User` |
| POST | `/api/v1/admin/billing/subscriptions/grant` | `AdminBillingController.grantSubscription` | Body: `GrantAdminSubscriptionDto` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `{ workspaceId, subscriptionId, planId, ownerId, currentPeriodStart, currentPeriodEnd }` | `Workspace`, `Role`, `UserRole`, `Plan`, `Subscription`, `SubscriptionWorkspace`, `UsageLimit` |
| POST | `/api/v1/admin/billing/subscriptions/revoke` | `AdminBillingController.revokeSubscription` | Body: `RevokeAdminSubscriptionDto` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `{ workspaceId, revoked, subscriptionId }` | `Workspace`, `SubscriptionWorkspace`, `UsageLimit`, `Plan` |
| GET | `/api/v1/admin/billing/payments` | `AdminBillingController.getPayments` | none | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped admin payment list | `Payment`, `Plan`, `Subscription`, `Workspace`, `User` |

### VNPay Test

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/billing/test-vnpay` | `BillingTestVnpayController.createPayment` | Body: `TestCreateVnpayPaymentDto` | Public | none | Wrapped VNPay test payment URL payload | VNPay gateway payload only |
| GET | `/api/v1/billing/test-vnpay/return` | `BillingTestVnpayController.handleReturn` | Query: `ReturnQueryFromVNPay` | Public | none | Wrapped VNPay return handling result | `Payment`, `Subscription`, VNPay callback data |
| GET | `/api/v1/billing/test-vnpay/ipn` | `BillingTestVnpayController.handleIpn` | Query: `ReturnQueryFromVNPay` | Public | none | Wrapped VNPay IPN handling result | `Payment`, `Subscription`, VNPay callback data |

### Features

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/features` | `FeaturesController.create` | Body: `CreateFeatureDto` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `FeatureResponseDto` | `Feature` |
| GET | `/api/v1/features` | `FeaturesController.findAll` | none | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `FeatureResponseDto[]` | `Feature` |
| GET | `/api/v1/features/:id` | `FeaturesController.findOne` | Params: `id` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `FeatureResponseDto` | `Feature` |
| PATCH | `/api/v1/features/:id` | `FeaturesController.update` | Body: `UpdateFeatureDto`; Params: `id` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `FeatureResponseDto` | `Feature` |
| DELETE | `/api/v1/features/:id` | `FeaturesController.remove` | Params: `id` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `{ success: true }` | `Feature` |

### Plan Features

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/plan-features` | `PlanFeaturesController.create` | Body: `CreatePlanFeatureDto` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `PlanFeatureResponseDto` | `PlanFeature`, `Plan`, `Feature` |
| GET | `/api/v1/plan-features` | `PlanFeaturesController.findAll` | none | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `PlanFeatureResponseDto[]` | `PlanFeature`, `Plan`, `Feature` |
| GET | `/api/v1/plan-features/:id` | `PlanFeaturesController.findOne` | Params: `id` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `PlanFeatureResponseDto` | `PlanFeature`, `Plan`, `Feature` |
| PATCH | `/api/v1/plan-features/:id` | `PlanFeaturesController.update` | Body: `UpdatePlanFeatureDto`; Params: `id` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `PlanFeatureResponseDto` | `PlanFeature`, `Plan`, `Feature` |
| DELETE | `/api/v1/plan-features/:id` | `PlanFeaturesController.remove` | Params: `id` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `{ success: true }` | `PlanFeature` |

### Workspace Feature Settings

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/workspace-feature-settings` | `WorkspaceFeatureSettingsController.create` | Body: `CreateWorkspaceFeatureSettingDto` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `WorkspaceFeatureSettingResponseDto` | `WorkspaceFeatureSetting`, `Workspace`, `Feature` |
| GET | `/api/v1/workspace-feature-settings` | `WorkspaceFeatureSettingsController.findAll` | none | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `WorkspaceFeatureSettingResponseDto[]` | `WorkspaceFeatureSetting`, `Workspace`, `Feature` |
| GET | `/api/v1/workspace-feature-settings/:id` | `WorkspaceFeatureSettingsController.findOne` | Params: `id` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `WorkspaceFeatureSettingResponseDto` | `WorkspaceFeatureSetting`, `Workspace`, `Feature` |
| PATCH | `/api/v1/workspace-feature-settings/:id` | `WorkspaceFeatureSettingsController.update` | Body: `UpdateWorkspaceFeatureSettingDto`; Params: `id` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `WorkspaceFeatureSettingResponseDto` | `WorkspaceFeatureSetting`, `Workspace`, `Feature` |
| DELETE | `/api/v1/workspace-feature-settings/:id` | `WorkspaceFeatureSettingsController.remove` | Params: `id` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `{ success: true }` | `WorkspaceFeatureSetting` |

### Workspace Features

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/workspaces/:workspaceId/features` | `WorkspaceFeaturesController.findWorkspaceFeatures` | Params: `workspaceId` | JWT, `PermissionGuard` | `WORKSPACE_FEATURE_READ` | Wrapped `WorkspaceFeatureStatusResponseDto[]` | `WorkspaceFeatureSetting`, `Feature`, `PlanFeature`, `Workspace` |
| PATCH | `/api/v1/workspaces/:workspaceId/features/:featureCode` | `WorkspaceFeaturesController.updateWorkspaceFeature` | Body: `UpdateWorkspaceFeatureDto`; Params: `workspaceId`, `featureCode` | JWT, `PermissionGuard` | `WORKSPACE_FEATURE_UPDATE` | Wrapped `WorkspaceFeatureStatusResponseDto` | `WorkspaceFeatureSetting`, `Feature`, `Workspace` |

### Admin

All admin endpoints require `JWT` and class-level `SystemRoleGuard` with system roles `SYSTEM_ADMIN` or `SUPER_ADMIN`.

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/admin/findAll-workspaces` | `AdminController.findAllWorkspace` | Query: `AdminFindAllWorkspaceQueryDto` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `AdminWorkspaceItemResponseDto[]` | `Workspace`, `UserWorkspace`, `Plan` |
| GET | `/api/v1/admin/findAll-workspaces-overview/:workspaceId` | `AdminController.getWorkspaceOverview` | Params: `workspaceId` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `AdminWorkspaceOverviewResponseDto` | `Workspace`, `Project`, `Task`, `UserWorkspace`, `Plan` |
| GET | `/api/v1/admin/workspaces/:workspaceId/member-summary` | `AdminController.getWorkspaceMemberSummary` | Params: `workspaceId` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `WorkspaceMemberSummaryResponseDto` | `Workspace`, `UserWorkspace`, `Role` |
| PATCH | `/api/v1/admin/workspaces/:workspaceId/plan` | `AdminController.updateWorkspacePlan` | Body: `UpdateWorkspacePlanDto`; Params: `workspaceId` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `WorkspaceResponseDto` | `Workspace`, `Plan`, `UsageLimit` |
| GET | `/api/v1/admin/dashboard/summary` | `AdminController.getDashboardSummary` | none | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `DashboardSummaryResponseDto` | `User`, `Workspace`, `Project`, `Task`, billing entities |
| GET | `/api/v1/admin/dashboard/user-growth` | `AdminController.getUserGrowth` | Query: `UserGrowthQueryDto` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `UserGrowthResponseDto[]` | `User` |
| GET | `/api/v1/admin/dashboard/workspace-growth` | `AdminController.getWorkspaceGrowth` | Query: `WorkspaceGrowthQueryDto` | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `WorkspaceGrowthResponseDto[]` | `Workspace` |
| GET | `/api/v1/admin/dashboard/workspace-plan` | `AdminController.getWorkspacePlan` | none | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `WorkspacePlanResponseDto[]` | `Workspace`, `Plan` |
| GET | `/api/v1/admin/dashboard/retention-metrics` | `AdminController.getRetentionMetrics` | none | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `RetentionMetricResponseDto[]` | `User`, `UserActivity` |
| GET | `/api/v1/admin/dashboard/system-health` | `AdminController.getSystemHealth` | none | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `SystemHealthResponseDto[]` | System/runtime/database summary |
| GET | `/api/v1/admin/dashboard/recent-activities` | `AdminController.getRecentActivities` | none | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `RecentActivityResponseDto[]` | `Activity`, `User`, workspace/project/task entities |
| GET | `/api/v1/admin/users/overview` | `AdminController.getUserOverview` | none | JWT, `SystemRoleGuard` | System roles: `SYSTEM_ADMIN`, `SUPER_ADMIN` | Wrapped `AdminUserOverviewResponseDto` | `User`, `UserProfile`, `UserActivity` |

### Mail

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/mail` | `MailController.sendEmailInviteMember` | none | Public | none | Wrapped `undefined` | Mail template only |

### User Activity

| Method | URL | Controller | DTO | Guards | Permissions | Response format | Related entities |
| --- | --- | --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/user-activity/record` | `UserActivityController.record` | Body: inline `RecordUserActivityDto` `{ userId, type? }` | JWT | none | Wrapped `{ success: true }` | `UserActivity`, `User` |

## Controllers With No HTTP Endpoints

These controllers define a `@Controller(...)` base path but no route method decorators in the reviewed source:

| Controller | Base path | Notes |
| --- | --- | --- |
| `RefreshTokenController` | `/api/v1/refresh-token` | No exposed methods |
| `UsersController` | `/api/v1/users` | No exposed methods |
| `RoleController` | `/api/v1/role` | No exposed methods |
| `PermissionController` | `/api/v1/permission` | No exposed methods |
| `RolePermissionController` | `/api/v1/role-permission` | No exposed methods |
| `UserRolesController` | `/api/v1/user-roles` | No exposed methods |
| `StorageController` | `/api/v1/storage` | No exposed methods |
| `UserProfilesController` | `/api/v1/user-profiles` | No exposed methods |
| `AuditLogsController` | `/api/v1/audit-logs` | No exposed methods |
| `MentionsController` | `/api/v1/mentions` | No exposed methods |
| `PageTemplatesController` | `/api/v1/page-templates` | No exposed methods |
| `PageTemplateBlocksController` | `/api/v1/page-template-blocks` | No exposed methods |

## Security Notes From Catalog

| Area | Observation |
| --- | --- |
| Public endpoints | Auth, Google OAuth, VNPay test callbacks, and mail test/template endpoint are public |
| Routes without explicit permissions | Several authenticated routes rely only on JWT, including board detail, task assignee routes, notification routes, attachment read/download, billing plans, current subscription, dashboard, and user activity |
| Feature gates | Sprint create/start/complete/cancel/update and task backlog/sprint movement require `SPRINT_ENABLED` |
| System admin routes | Feature, plan-feature, workspace-feature-setting, and admin controllers are protected by system roles |
| Response transform exception | Google OAuth callback skips transformation and performs a raw redirect |
