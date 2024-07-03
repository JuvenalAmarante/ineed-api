import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';
import { CadastrarUsuarioDto } from './dto/cadastrar-usuario.dto';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { AtualizarAtributoUsuarioDto } from './dto/atualizar-atributo-usuario.dto';
import { AtualizarSenhaUsuarioDto } from './dto/atualizar-senha-usuario.dto';
import { FiltroListarTodosUsuarioDto } from './dto/filtro-listar-todos-usuario.dto';

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
      Nome: data.nome,
      Usuario: data,
      message: 'Usuário cadastrado com sucesso',
    };
  }

  @Put('atualizar')
  @UseGuards(AuthGuard)
  async atualizar(
    @CurrentUser() usuario: DadosUsuarioLogado,
    @Body() atualizarUsuarioDto: AtualizarUsuarioDto,
  ) {
    const data = await this.usuarioService.atualizar(
      usuario.Id,
      atualizarUsuarioDto,
    );

    return {
      Usuario: data,
      message: 'Usuário atualizado com sucesso',
    };
  }

  @Put('atualizar/atributo')
  @UseGuards(AuthGuard)
  async atualizarAtributo(
    @CurrentUser() usuario: DadosUsuarioLogado,
    @Body() atualizarAtributoUsuarioDto: AtualizarAtributoUsuarioDto,
  ) {
    const data = await this.usuarioService.atualizar(
      usuario.Id,
      atualizarAtributoUsuarioDto,
    );

    return {
      Usuario: data,
      message: 'Usuário atualizado com sucesso',
    };
  }

  @Patch('atualizarSenha')
  @UseGuards(AuthGuard)
  async atualizarSenha(
    @CurrentUser() usuario: DadosUsuarioLogado,
    @Body() atualizarSenhaUsuarioDto: AtualizarSenhaUsuarioDto,
  ) {
    const data = await this.usuarioService.atualizarSenha(
      usuario.Id,
      atualizarSenhaUsuarioDto,
    );

    return {
      Usuario: data,
      message: 'Senha atualizada com sucesso',
    };
  }

  @Get('listarTodos')
  @UseGuards(AuthGuard)
  async listarTodos(
    @Query() filtroListarTodosUsuarioDto: FiltroListarTodosUsuarioDto,
    @CurrentUser() usuario: DadosUsuarioLogado,
  ) {
    const data = await this.usuarioService.listarTodos(
      usuario,
      filtroListarTodosUsuarioDto,
    );

    return {
      usuario: data,
    };
  }
}
