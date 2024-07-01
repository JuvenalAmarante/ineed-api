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
} from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { AuthGuard } from 'src/shared/guards/auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';
import { CadastrarUsuarioDto } from './dto/cadastrar-usuario.dto';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { AtualizarAtributoUsuarioDto } from './dto/atualizar-atributo-usuario.dto';

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

  @Put('atualizar')
  async atualizar(@Body() atualizarUsuarioDto: AtualizarUsuarioDto, @CurrentUser() usuario: DadosUsuarioLogado) {
    const data = await this.usuarioService.atualizar(usuario.Id, atualizarUsuarioDto);

    return {
      Usuario: data,
      message: 'Usuário atualizado com sucesso',
    };
  }

  @Put('atualizar/atributo')
  async atualizarAtributo(@Body() atualizarAtributoUsuarioDto: AtualizarAtributoUsuarioDto, @CurrentUser() usuario: DadosUsuarioLogado) {
    const data = await this.usuarioService.atualizar(usuario.Id, atualizarAtributoUsuarioDto);

    return {
      Usuario: data,
      message: 'Usuário atualizado com sucesso',
    };
  }
}
