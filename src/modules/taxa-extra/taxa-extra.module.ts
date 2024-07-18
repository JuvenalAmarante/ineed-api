import { Module } from '@nestjs/common';
import { TaxaExtraService } from './taxa-extra.service';
import { TaxaExtraController } from './taxa-extra.controller';
import { PushNotificationModule } from 'src/shared/services/push-notification/push-notification.module';

@Module({
  imports: [PushNotificationModule],
  controllers: [TaxaExtraController],
  providers: [TaxaExtraService],
})
export class TaxaExtraModule {}
