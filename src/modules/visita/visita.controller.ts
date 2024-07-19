import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { VisitaService } from './visita.service';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { FiltroListarVisitaDto } from './dto/filtro-listar-visita.dto';

@Controller('visita')
export class VisitaController {
  constructor(private readonly visitaService: VisitaService) {}

  @Get()
  @UseGuards(AuthGuard)
  async listar(
    @CurrentUser() usuario: DadosUsuarioLogado,
    @Query() filtroListarVisitaDto: FiltroListarVisitaDto,
    @Headers('Page') paginaAtual: string,
  ) {
    const dados = await this.visitaService.listar(
      usuario,
      filtroListarVisitaDto,
      +paginaAtual,
    );

    if (filtroListarVisitaDto.id) return dados;

    return {
      visitas: dados,
    };
  }
}
