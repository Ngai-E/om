import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { PaymentsModule } from '../payments/payments.module';
import { PromotionsModule } from '../promotions/promotions.module';

@Module({
  imports: [PaymentsModule, PromotionsModule],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
