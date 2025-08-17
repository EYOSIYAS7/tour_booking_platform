// import { Module } from '@nestjs/common';
// import { PrismaService } from './prisma.service';

// @Module({
//   providers: [PrismaService]
// })
// export class PrismaModule {}

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Makes the service available everywhere
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
