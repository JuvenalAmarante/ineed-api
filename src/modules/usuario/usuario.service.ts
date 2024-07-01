import { BadRequestException, Injectable } from '@nestjs/common';
import { CadastrarUsuarioDto } from './dto/cadastrar-usuario.dto';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';
import { encriptar } from 'src/shared/helpers/encrypt.helper';
import { AtualizarUsuarioDto } from './dto/atualizar-usuario.dto';
import { AtualizarAtributoUsuarioDto } from './dto/atualizar-atributo-usuario.dto';

@Injectable()
export class UsuarioService {
  constructor(private readonly prisma: PrismaService) {}

  listarDados(usuario: DadosUsuarioLogado) {
    return this.prisma.usuario.findFirst({
      where: {
        Id: usuario.Id,
      },
    });
  }

  async cadastrar(cadastrarUsuarioDto: CadastrarUsuarioDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        Email: cadastrarUsuarioDto.Email,
      },
    });

    if (usuario) throw new BadRequestException('Usuário já cadastrado');

    return this.prisma.usuario.create({
      data: {
        Email: cadastrarUsuarioDto.Email,
        Senha: encriptar(cadastrarUsuarioDto.Senha),
        Nome: cadastrarUsuarioDto.Nome,
        PerfilId: cadastrarUsuarioDto.PerfilId,
        TipoId: cadastrarUsuarioDto.TipoId,
        Endereco: cadastrarUsuarioDto.Endereco || undefined,
        Rg: cadastrarUsuarioDto.Rg || undefined,
        Cidade: cadastrarUsuarioDto.Cidade || undefined,
        Uf: cadastrarUsuarioDto.Uf || undefined,
        CpfCnpj: cadastrarUsuarioDto.CpfCnpj || undefined,
        Numero: cadastrarUsuarioDto.Numero || undefined,
        ImagemUrl: cadastrarUsuarioDto.ImagemUrl || undefined,
        Complemento: cadastrarUsuarioDto.Complemento || undefined,
        Cep: cadastrarUsuarioDto.Cep || undefined,
        Telefone: cadastrarUsuarioDto.Telefone || undefined,
        DataAniversario: cadastrarUsuarioDto.DataAniversario || undefined,
        IdTipoRedeSocial: cadastrarUsuarioDto.IdTipoRedeSocial || 0,
        IdRedeSocial: cadastrarUsuarioDto.IdRedeSocial || undefined,
        CupomId: cadastrarUsuarioDto.CupomId || undefined,
        ContaRedeSocial:
          cadastrarUsuarioDto.ContaRedeSocial != null
            ? cadastrarUsuarioDto.ContaRedeSocial
            : false,
        CriadoEm: new Date(),
        Inativo: false,
      },
    });
  }

  async atualizar(id: number, atualizarUsuarioDto: AtualizarUsuarioDto | AtualizarAtributoUsuarioDto) {
    if (atualizarUsuarioDto.Email) {
      const emailExiste = await this.prisma.usuario.findFirst({
        where: {
          Email: atualizarUsuarioDto.Email,
          Id: {
            not: id,
          },
        },
      });

      if (emailExiste) throw new BadRequestException('Email já cadastrado');
    }

    if (atualizarUsuarioDto.CpfCnpj) {
      const cpfCnpjExiste = await this.prisma.usuario.findFirst({
        where: {
          CpfCnpj: atualizarUsuarioDto.CpfCnpj,
          Id: {
            not: id,
          },
        },
      });

      if (cpfCnpjExiste)
        throw new BadRequestException('CPF/CNPJ já cadastrado');
    }

    return this.prisma.usuario.update({
      data: {
        Email: atualizarUsuarioDto.Email || undefined,
        Senha: atualizarUsuarioDto.Senha ? encriptar(atualizarUsuarioDto.Senha) : undefined,
        Nome: atualizarUsuarioDto.Nome || undefined,
        PerfilId: atualizarUsuarioDto.PerfilId || undefined,
        TipoId: atualizarUsuarioDto.TipoId || undefined,
        Endereco: atualizarUsuarioDto.Endereco || undefined,
        Rg: atualizarUsuarioDto.Rg || undefined,
        Cidade: atualizarUsuarioDto.Cidade || undefined,
        Uf: atualizarUsuarioDto.Uf || undefined,
        CpfCnpj: atualizarUsuarioDto.CpfCnpj || undefined,
        Numero: atualizarUsuarioDto.Numero || undefined,
        ImagemUrl: atualizarUsuarioDto.ImagemUrl || undefined,
        Complemento: atualizarUsuarioDto.Complemento || undefined,
        Cep: atualizarUsuarioDto.Cep || undefined,
        Telefone: atualizarUsuarioDto.Telefone || undefined,
        DataAniversario: atualizarUsuarioDto.DataAniversario || undefined,
        IdTipoRedeSocial: atualizarUsuarioDto.IdTipoRedeSocial || undefined,
        IdRedeSocial: atualizarUsuarioDto.IdRedeSocial || undefined,
        CupomId: atualizarUsuarioDto.CupomId || undefined,
        ContaRedeSocial:
          atualizarUsuarioDto.ContaRedeSocial != null
            ? atualizarUsuarioDto.ContaRedeSocial
            : undefined,
      },
      where: {
        Id: id,
      },
    });
  }
}
