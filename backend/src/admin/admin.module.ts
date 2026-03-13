import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { CleanupController } from './cleanup.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController, CleanupController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
