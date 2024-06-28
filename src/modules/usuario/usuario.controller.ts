import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Post,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';
import { CadastrarUsuarioDto } from './dto/cadastrar-usuario.dto';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @UseGuards(AuthGuard)
  @Get('listar')
  async listarDados(@CurrentUser() usuario: DadosUsuarioLogado) {
    return {
      usuario: await this.usuarioService.listarDados(usuario),
    };
  }

  @Post('cadastrar')
  async cadastrar(@Body() cadastrarUsuarioDto: CadastrarUsuarioDto) {
    const data = await this.usuarioService.cadastrar(cadastrarUsuarioDto);

    return {
      Nome: data.Nome,
      Usuario: data,
      message: 'Usuário cadastrado com sucesso',
    };
  }
}
