// apps/api/src/email/email.module.ts
import { Module, Global } from '@nestjs/common';
import { EmailService } from './email.service';

@Global() // Makes EmailService available everywhere without importing the module
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
