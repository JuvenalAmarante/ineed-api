import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { PrismaModule } from './shared/services/prisma/prisma.module';
import { MailModule } from './shared/services/mail/mail.module';
import { ConfiguracaoModule } from './modules/configuracao/configuracao.module';
import { CupomModule } from './modules/cupom/cupom.module';
import { DescontoModule } from './modules/desconto/desconto.module';
import { OrcamentoModule } from './modules/orcamento/orcamento.module';
import { SmsModule } from './shared/services/sms/sms.module';
import { PushNotificationModule } from './shared/services/push-notification/push-notification.module';
import { SolicitacaoModule } from './modules/solicitacao/solicitacao.module';
import { S3Module } from './shared/services/s3/s3.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsuarioModule,
    MailModule,
    ConfiguracaoModule,
    CupomModule,
    DescontoModule,
    OrcamentoModule,
    SmsModule,
    PushNotificationModule,
    SolicitacaoModule,
    S3Module,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
