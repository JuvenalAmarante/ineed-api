import { Module } from '@nestjs/common';
import { SolicitacaoService } from './solicitacao.service';
import { SolicitacaoController } from './solicitacao.controller';
import { ValidarQuantidade } from './validations/validar-quantidade.validation';

@Module({
  controllers: [SolicitacaoController],
  providers: [SolicitacaoService, ValidarQuantidade],
})
export class SolicitacaoModule {}
