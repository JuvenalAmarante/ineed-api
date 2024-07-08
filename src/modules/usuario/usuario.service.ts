import { FiltroListarTodosUsuarioDto } from './dto/filtro-listar-todos-usuario.dto';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CadastrarUsuarioDto } from './dto/cadastrar-usuario.dto';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';
import { encriptar } from 'src/shared/helpers/encrypt.helper';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { AtualizarAtributoUsuarioDto } from './dto/atualizar-atributo-usuario.dto';
import { AtualizarSenhaUsuarioDto } from './dto/atualizar-senha-usuario.dto';
import { PerfilEnum } from 'src/shared/enums/perfil.enum';

@Injectable()
export class UsuarioService {
  constructor(private readonly prisma: PrismaService) {}

  async listarDados(usuario: DadosUsuarioLogado) {
    const dados = await this.prisma.usuario.findFirst({
      where: {
        id: usuario.id,
      },
    });

    dados.senha = null;

    return dados;
  }

  async cadastrar(cadastrarUsuarioDto: CadastrarUsuarioDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        email: cadastrarUsuarioDto.Email,
      },
    });

    if (usuario) throw new BadRequestException('Usuário já cadastrado');

    return this.prisma.usuario.create({
      data: {
        email: cadastrarUsuarioDto.Email,
        senha: encriptar(cadastrarUsuarioDto.Senha),
        nome: cadastrarUsuarioDto.Nome,
        perfilId: cadastrarUsuarioDto.PerfilId,
        tipoId: cadastrarUsuarioDto.TipoId,
        endereco: cadastrarUsuarioDto.Endereco || undefined,
        rg: cadastrarUsuarioDto.Rg || undefined,
        cidade: cadastrarUsuarioDto.Cidade || undefined,
        uf: cadastrarUsuarioDto.Uf || undefined,
        cpfCnpj: cadastrarUsuarioDto.CpfCnpj || undefined,
        numero: cadastrarUsuarioDto.Numero || undefined,
        imagemUrl: cadastrarUsuarioDto.ImagemUrl || undefined,
        complemento: cadastrarUsuarioDto.Complemento || undefined,
        cep: cadastrarUsuarioDto.Cep || undefined,
        telefone: cadastrarUsuarioDto.Telefone || undefined,
        dataAniversario: cadastrarUsuarioDto.DataAniversario || undefined,
        idTipoRedeSocial: cadastrarUsuarioDto.IdTipoRedeSocial || 0,
        idRedeSocial: cadastrarUsuarioDto.IdRedeSocial || undefined,
        cupomId: cadastrarUsuarioDto.CupomId || undefined,
        contaRedeSocial:
          cadastrarUsuarioDto.ContaRedeSocial != null
            ? cadastrarUsuarioDto.ContaRedeSocial
            : false,
        criadoEm: new Date(),
        inativo: false,
      },
    });
  }

  async atualizar(
    id: number,
    atualizarUsuarioDto: AtualizarUsuarioDto | AtualizarAtributoUsuarioDto,
  ) {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: id,
      },
    });

    if (!usuario) throw new BadRequestException('Usuário não cadastrado');

    if (atualizarUsuarioDto.Email) {
      const emailExiste = await this.prisma.usuario.findFirst({
        where: {
          email: atualizarUsuarioDto.Email,
          id: {
            not: id,
          },
        },
      });

      if (emailExiste) throw new BadRequestException('Email já cadastrado');
    }

    if (atualizarUsuarioDto.CpfCnpj) {
      const cpfCnpjExiste = await this.prisma.usuario.findFirst({
        where: {
          cpfCnpj: atualizarUsuarioDto.CpfCnpj,
          id: {
            not: id,
          },
        },
      });

      if (cpfCnpjExiste)
        throw new BadRequestException('CPF/CNPJ já cadastrado');
    }

    return this.prisma.usuario.update({
      data: {
        email: atualizarUsuarioDto.Email || undefined,
        senha: atualizarUsuarioDto.Senha
          ? encriptar(atualizarUsuarioDto.Senha)
          : undefined,
        nome: atualizarUsuarioDto.Nome || undefined,
        perfilId: atualizarUsuarioDto.PerfilId || undefined,
        tipoId: atualizarUsuarioDto.TipoId || undefined,
        endereco: atualizarUsuarioDto.Endereco || undefined,
        rg: atualizarUsuarioDto.Rg || undefined,
        cidade: atualizarUsuarioDto.Cidade || undefined,
        uf: atualizarUsuarioDto.Uf || undefined,
        cpfCnpj: atualizarUsuarioDto.CpfCnpj || undefined,
        numero: atualizarUsuarioDto.Numero || undefined,
        imagemUrl: atualizarUsuarioDto.ImagemUrl || undefined,
        complemento: atualizarUsuarioDto.Complemento || undefined,
        cep: atualizarUsuarioDto.Cep || undefined,
        telefone: atualizarUsuarioDto.Telefone || undefined,
        dataAniversario: atualizarUsuarioDto.DataAniversario || undefined,
        idTipoRedeSocial: atualizarUsuarioDto.IdTipoRedeSocial || undefined,
        idRedeSocial: atualizarUsuarioDto.IdRedeSocial || undefined,
        cupomId: atualizarUsuarioDto.CupomId || undefined,
        contaRedeSocial:
          atualizarUsuarioDto.ContaRedeSocial != null
            ? atualizarUsuarioDto.ContaRedeSocial
            : undefined,
      },
      where: {
        id,
      },
    });
  }

  async atualizarSenha(
    id: number,
    atualizarSenhaUsuarioDto: AtualizarSenhaUsuarioDto,
  ) {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id,
      },
    });

    if (!usuario) throw new BadRequestException('Usuário não cadastrado');

    const senhaAtualValida = await this.prisma.usuario.findFirst({
      where: {
        id,
        senha: encriptar(atualizarSenhaUsuarioDto.senhaAtual),
      },
    });

    if (!senhaAtualValida)
      throw new BadRequestException('Senha atual incorreta');

    await this.prisma.usuario.update({
      data: {
        senha: encriptar(atualizarSenhaUsuarioDto.novaSenha),
      },
      where: {
        id,
      },
    });
  }

  async listarTodos(
    usuario: DadosUsuarioLogado,
    filtroListarTodosUsuarioDto: FiltroListarTodosUsuarioDto,
  ) {
    if (![PerfilEnum.ADMIN, PerfilEnum.FORNECEDOR].includes(usuario.perfilId))
      throw new UnauthorizedException('O usuário não tem permissão de acesso');

    const listaUsuarios = await this.prisma.usuario.findMany({
      include: {
        tipo: true,
        cupom: true,
      },
      where: {
        OR: [
          {
            nome: {
              contains: filtroListarTodosUsuarioDto.nome,
            },
          },
          {
            email: {
              contains: filtroListarTodosUsuarioDto.nome,
            },
          },
        ],
        perfilId: filtroListarTodosUsuarioDto.profileId || undefined,
      },
    });

    listaUsuarios.forEach((item) => {
      item.senha = null;
    });

    return listaUsuarios;
  }
}
