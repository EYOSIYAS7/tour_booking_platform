import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from '@prisma/client';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, role: true, email: true },
    });
  }

  async updateUserRole(userUpdateId: string, dto: UpdateUserRoleDto) {
    // Check if the user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userUpdateId },
    });
    if (!user) throw new NotFoundException('user not found');

    // defensive programming check
    // do not demote if the user is the last admin
    if (user.role === Role.ADMIN && dto.role === Role.USER) {
      const adminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN },
      });

      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot demote the last admin user');
      }
    }

    return this.prisma.user.update({
      where: { id: userUpdateId },
      data: { role: dto.role },
    });
  }
}
