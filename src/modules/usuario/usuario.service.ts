import { BadRequestException, Injectable } from '@nestjs/common';
import { CadastrarUsuarioDto } from './dto/cadastrar-usuario.dto';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';
import { encriptar } from 'src/shared/helpers/encrypt.helper';

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
}
