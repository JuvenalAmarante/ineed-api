import { FiltroListarDescontoDto } from './dto/filtro-listar-desconto.dto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';
import { PerfilEnum } from 'src/shared/enums/perfil.enum';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';

@Injectable()
export class DescontoService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    usuario: DadosUsuarioLogado,
    filtroListarDescontoDto: FiltroListarDescontoDto,
  ) {
    switch (usuario.PerfilId) {
      case PerfilEnum.CLIENTE:
        if (!filtroListarDescontoDto.id)
          return this.listarDescontoPorUsuario(usuario.Id);
        return this.listarDescontoPorId(filtroListarDescontoDto.id);
      default:
        throw new UnauthorizedException(
          'Apenas clientes têm acesso aos descontos',
        );
    }
  }

  private mapear(desconto: any) {
    return {
      ativado: desconto.ativado,
      cupomId: desconto.cupomId,
      desconto: desconto.taxa,
      id: desconto.id,
    };
  }

  private async listarDescontoPorUsuario(usuarioId: number) {
    return (
      await this.prisma.desconto.findMany({
        where: {
          UserId: usuarioId,
        },
        orderBy: {
          Taxa: 'desc',
        },
      })
    ).map((desconto) => this.mapear(desconto));
  }

  private async listarDescontoPorId(id: number) {
    return this.mapear(
      await this.prisma.desconto.findUnique({
        where: { Id: id },
      }),
    );
  }
}
