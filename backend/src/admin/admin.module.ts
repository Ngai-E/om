import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { CleanupController } from './cleanup.controller';
import { CustomersController } from './customers.controller';
import { AdminService } from './admin.service';
import { CustomersService } from './customers.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [AdminController, CleanupController, CustomersController],
  providers: [AdminService, CustomersService],
  exports: [AdminService, CustomersService],
})
export class AdminModule {}
