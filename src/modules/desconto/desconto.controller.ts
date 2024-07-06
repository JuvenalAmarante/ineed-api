import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DescontoService } from './desconto.service';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { FiltroListarCupomDto } from '../cupom/dto/filtro-listar-cupom.dto';

@Controller('desconto')
export class DescontoController {
  constructor(private readonly descontoService: DescontoService) {}

  @Get()
  @UseGuards(AuthGuard)
  async listar(
    @CurrentUser() usuario: DadosUsuarioLogado,
    @Query() filtroListarCupomDto: FiltroListarCupomDto,
  ) {
    return {
      descontos: await this.descontoService.listar(
        usuario,
        filtroListarCupomDto,
      ),
    };
  }
}
