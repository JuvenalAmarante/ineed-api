import { Controller, Delete, Get, Query, UseGuards } from '@nestjs/common';
import { SolicitacaoService } from './solicitacao.service';
import { FiltroListarSolicitacaoDto } from './dto/filtro-listar-solicitacao.dto';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { DeletarSolicitacaoDto } from './dto/deletar-solicitacao.dto';

@Controller()
@UseGuards(AuthGuard)
export class SolicitacaoController {
  constructor(private readonly solicitacaoService: SolicitacaoService) {}

  @Get('listarSolicitacao')
  async listar(
    @CurrentUser() usuario: DadosUsuarioLogado,
    @Query() filtroListarSolicitacaoDto: FiltroListarSolicitacaoDto,
  ) {
    const dados = await this.solicitacaoService.listar(
      usuario,
      filtroListarSolicitacaoDto,
    );

    if (Array.isArray(dados)) {
      if (dados.length)
        return {
          solicit: dados,
        };

      return {
        error: [],
      };
    }

    return dados;
  }

  @Delete('solicitacao')
  async deletar(
    @CurrentUser() usuario: DadosUsuarioLogado,
    @Query() deletarSolicitacaoDto: DeletarSolicitacaoDto,
  ) {
    await this.solicitacaoService.deletar(deletarSolicitacaoDto.id, usuario);

    return {
      message: 'A solicitação foi excluída com sucesso!',
    };
  }
}
