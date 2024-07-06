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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
