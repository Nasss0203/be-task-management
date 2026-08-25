// Shared authorization guard; Identity owns the SystemRole contract.
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SystemRole } from 'src/modules/identity/identity.types';
import { SYSTEM_ROLES_KEY } from '../decorator/require-system-roles.decorator';

@Injectable()
export class SystemRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(
      SYSTEM_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Không có yêu cầu role → cho qua
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const userSystemRole: SystemRole = req.user?.systemRole;

    if (!userSystemRole) {
      throw new ForbiddenException('User system role not found');
    }

    const hasRole = requiredRoles.includes(userSystemRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `Required system role: [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
