import { Module } from '@nestjs/common';
import { OrcamentoService } from './orcamento.service';
import { OrcamentoController } from './orcamento.controller';
import { MailModule } from 'src/shared/services/mail/mail.module';
import { SmsModule } from 'src/shared/sms/sms.module';

@Module({
  imports: [MailModule, SmsModule],
  controllers: [OrcamentoController],
  providers: [OrcamentoService],
})
export class OrcamentoModule {}
