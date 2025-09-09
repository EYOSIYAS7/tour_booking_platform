import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Observable } from 'rxjs';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // get the user from the request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user && user.role === Role.ADMIN) {
      return true; // Allow access if user is an ADMIN
    }

    // If not an admin, deny access
    throw new ForbiddenException(
      'You do not have permission to access this resource.',
    );
  }
}
