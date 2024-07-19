import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VisitaService } from './visita.service';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { FiltroListarVisitaDto } from './dto/filtro-listar-visita.dto';
import { CadastrarVisitaDto } from './dto/cadastrar-visita.dto';

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

  @Post()
  @UseGuards(AuthGuard)
  async cadastrar(
    @CurrentUser() usuario: DadosUsuarioLogado,
    @Body() cadastrarVisitaDto: CadastrarVisitaDto,
  ) {
    const dados = await this.visitaService.cadastrar(
      usuario,
      cadastrarVisitaDto,
    );

    return {
      message: 'Visita Cadastrada com Sucesso.',
      visita: dados,
    };
  }
}
