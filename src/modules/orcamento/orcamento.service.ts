import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { FiltroListarOrcamentoDto } from './dto/filtro-listar-orcamento.dto';
import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';
import { PerfilEnum } from 'src/shared/enums/perfil.enum';
import { Prisma } from '@prisma/client';
import { Orcamento } from './entities/orcamento.entity';

@Injectable()
export class OrcamentoService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    usuario: DadosUsuarioLogado,
    filtroListarOrcamentoDto: FiltroListarOrcamentoDto,
    paginaAtual = 1,
  ) {
    if (!!filtroListarOrcamentoDto.search) {
      return this.listarFiltradoPorBusca(filtroListarOrcamentoDto.search);
    }

    if (!filtroListarOrcamentoDto.id) {
      switch (usuario.perfilId) {
        case PerfilEnum.CLIENTE:
          return this.listarTodos(usuario.id, paginaAtual);
        case PerfilEnum.ADMIN:
        case PerfilEnum.FORNECEDOR:
          return this.listarTodos(null, paginaAtual);
      }
    }

    return this.listarFiltradoPorId(filtroListarOrcamentoDto.id);
  }

  private async mapear(orcamento: Orcamento) {
    return {
      id: orcamento.id,
      usuarioId: orcamento.usuarioId,
      dataEntrega: orcamento.dataEntrega,
      dataCriacao: orcamento.dataCriacao,
      solicitacaoId: orcamento.solicitacaoId,
      observacao: orcamento.observacao,
      maoObra: orcamento.maoObra,
      concluido: orcamento.concluido,
      pago: orcamento.pago,
      material: orcamento.material,
      diarioObra: orcamento.diarioObra,
      requisicaoId: orcamento.requisicaoId,
      avaliacaoId: orcamento.avaliacaoId,
      imagem: orcamento.imagem,
      requisicao: orcamento.requisicao,
      avaliacao: orcamento.avaliacao,
      nomeCliente: orcamento.solicitacao.usuario.nome,
      emailCliente: orcamento.solicitacao.usuario.email,
      idCliente: orcamento.solicitacao.usuarioId,
      solicitacao: orcamento.solicitacao,
      taxasExtras: orcamento.taxasExtras,
      usuarioCollaborador: orcamento.usuarioCollaborador?.map(
        (item) => item.usuario,
      ),
    };
  }

  private async listarFiltradoPorBusca(busca: string) {
    return this.prisma.orcamento.findMany({
      where: {
        solicitacao: {
          usuario: {
            nome: {
              contains: busca,
            },
          },
        },
      },
    });
  }

  private async listarTodos(
    usuarioId?: number,
    paginaAtual = 1,
    totalPaginas = 10,
  ) {
    const dados: Orcamento[] = await this.prisma.orcamento.findMany({
      include: {
        imagem: true,
        avaliacao: true,
        solicitacao: {
          include: {
            servicoSolicitacao: true,
            usuario: {
              include: {
                cupom: true,
                tipo: true,
              },
            },
            imagem: true,
            orcamentos: true,
          },
        },
        transacao: true,
      },
      where: {
        usuarioId: usuarioId || undefined,
      },
      orderBy: {
        dataEntrega: 'desc',
      },
      skip: paginaAtual > 0 ? (paginaAtual - 1) * totalPaginas : 0,
      take: totalPaginas,
    });

    return dados.map(this.mapear);
  }

  private async listarFiltradoPorId(id: number) {
    const orcamento = await this.prisma.orcamento.findUnique({
      include: {
        imagem: true,
        avaliacao: true,
        solicitacao: {
          include: {
            servicoSolicitacao: true,
            usuario: {
              include: {
                cupom: true,
                tipo: true,
              },
            },
            imagem: true,
            orcamentos: true,
          },
        },
        transacao: true,
      },
      where: {
        id,
      },
    });
    if (!orcamento) throw new BadRequestException('Orçamento não encontrado');

    return this.mapear(orcamento);
  }
}
