import { BadRequestException, Injectable } from '@nestjs/common';
import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { FiltroListarVisitaDto } from './dto/filtro-listar-visita.dto';
import { PerfilEnum } from 'src/shared/enums/perfil.enum';

@Injectable()
export class VisitaService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    usuario: DadosUsuarioLogado,
    filtroListarVisitaDto: FiltroListarVisitaDto,
    paginaAtual = 1,
  ) {
    if (filtroListarVisitaDto.id) {
      return this.listarPorId(filtroListarVisitaDto.id);
    } else {
      return this.listarTodos(usuario.id, usuario.perfilId, paginaAtual);
    }
  }

  private async listarPorId(id: number) {
    const visita = await this.prisma.visita.findFirst({
      include: {
        solicitacao: true,
      },
      where: {
        id,
      },
    });

    if (!visita) throw new BadRequestException('Visita não encontrada');

    const solicitacao = await this.prisma.solicitacao.findUnique({
      include: {
        usuario: true,
      },
      where: {
        id: visita.solicitacaoId,
      },
    });

    const orcamento = await this.prisma.orcamento.count({
      where: {
        solicitacaoId: solicitacao.id,
      },
    });

    return {
      visita,
      solicitacao,
      hasOrcamento: orcamento > 0,
    };
  }

  private async listarTodos(
    usuarioId: number,
    perfilId: PerfilEnum,
    paginaAtual = 1,
    totalPaginas = 10,
  ) {
    let visitas = [];

    switch (perfilId) {
      case PerfilEnum.CLIENTE:
        visitas = await this.prisma.visita.findMany({
          include: {
            solicitacao: true,
          },
          where: {
            solicitacao: {
              usuarioId: usuarioId,
            },
          },
          orderBy: {
            dataCriacao: 'desc',
          },
          skip: paginaAtual > 0 ? (paginaAtual - 1) * totalPaginas : 0,
          take: totalPaginas,
        });
      case PerfilEnum.ADMIN:
      case PerfilEnum.FORNECEDOR:
        visitas = await this.prisma.visita.findMany({
          include: {
            solicitacao: true,
          },
          orderBy: {
            dataCriacao: 'desc',
          },
          skip: paginaAtual > 0 ? (paginaAtual - 1) * totalPaginas : 0,
          take: totalPaginas,
        });
    }

    if (!visitas.length) throw new BadRequestException('Não há nenhuma visita');

    return visitas;
  }
}
