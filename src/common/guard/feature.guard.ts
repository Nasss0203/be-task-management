import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type FeatureAccessService } from 'src/modules/features/interfaces/services/feature-access.service.interface';
import { FEATURE_TYPES } from 'src/modules/features/interfaces/types';
import { SystemRole } from 'src/modules/users/domain/entities/user.entity';
import { FEATURES_KEY } from '../decorator/require-features.decorator';
import {
  WORKSPACE_CONTEXT_KEY,
  WorkspaceContextMeta,
} from '../decorator/workspace-context.decorator';
import { WorkspaceResolverService } from '../services/workspace-resolver.service';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly workspaceResolver: WorkspaceResolverService,
    @Inject(FEATURE_TYPES.services.FeatureAccessService)
    private readonly featureAccessService: FeatureAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatures = this.reflector.getAllAndOverride<string[]>(
      FEATURES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const userId = user?.id;
    const systemRole = user?.systemRole;

    if (!userId) {
      throw new ForbiddenException('User not found in request');
    }

    if (systemRole === SystemRole.SUPER_ADMIN) {
      return true;
    }

    const workspaceContext =
      this.reflector.getAllAndOverride<WorkspaceContextMeta>(
        WORKSPACE_CONTEXT_KEY,
        [context.getHandler(), context.getClass()],
      );

    if (!workspaceContext) {
      throw new ForbiddenException(
        'Route is missing @WorkspaceContext decorator',
      );
    }

    const workspaceId = await this.workspaceResolver.resolve(
      req,
      workspaceContext,
    );

    if (!workspaceId) {
      throw new ForbiddenException('Workspace id not found');
    }

    await Promise.all([
      this.featureAccessService.assertUserWorkspaceMembership(
        userId,
        workspaceId,
      ),
      ...requiredFeatures.map((featureKey) =>
        this.featureAccessService.assertFeatureEnabledForWorkspace(
          workspaceId,
          featureKey,
        ),
      ),
    ]);

    return true;
  }
}
