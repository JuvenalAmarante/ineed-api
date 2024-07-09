import { ConfirmarOrcamentoDto } from './dto/confirmar-orcamento.dto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { FiltroListarOrcamentoDto } from './dto/filtro-listar-orcamento.dto';
import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';
import { PerfilEnum } from 'src/shared/enums/perfil.enum';
import { Prisma } from '@prisma/client';
import { Orcamento } from './entities/orcamento.entity';
import { CadastrarOrcamentoDto } from './dto/cadastrar-orcamento.dto';
import { MailService } from 'src/shared/services/mail/mail.service';
import { Decimal } from '@prisma/client/runtime/library';
import { SmsService } from 'src/shared/services/sms/sms.service';
import { AtualizarOrcamentoDto } from './dto/atualizar-orcamento.dto';
import { MetodoPagamentoEnum } from 'src/shared/enums/metodo-pagamento.enum';

@Injectable()
export class OrcamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
  ) {}

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

  async cadastrar(
    usuario: DadosUsuarioLogado,
    cadastrarOrcamentoDto: CadastrarOrcamentoDto,
  ) {
    const solicitacao = await this.validarDadosCadastrar(
      usuario,
      cadastrarOrcamentoDto,
    );

    const orcamento = await this.prisma.orcamento.create({
      data: {
        usuarioId: cadastrarOrcamentoDto.usuarioId,
        dataCriacao: new Date(),
        dataEntrega: cadastrarOrcamentoDto.dataEntrega,
        maoObra: cadastrarOrcamentoDto.maoObra,
        material: cadastrarOrcamentoDto.material,
        pago: cadastrarOrcamentoDto.pago,
        solicitacaoId: cadastrarOrcamentoDto.solicitacaoId,
        usuarioCollaborador: cadastrarOrcamentoDto.usuarioId
          ? {
              create: {
                usuarioColaboradorId: cadastrarOrcamentoDto.usuarioId,
              },
            }
          : undefined,
        concluido: cadastrarOrcamentoDto.concluido,
      },
    });

    const valores = [
      orcamento.maoObra > new Decimal(0)
        ? 'Mão de obra: ' + orcamento.maoObra
        : '',
      'Endereço: ' + solicitacao.endereco,
      solicitacao.dataFinal.getFullYear() > 1000
        ? 'Data inicial: ' + solicitacao.dataInicial.toLocaleString('pt-BR')
        : '',
      solicitacao.dataSolicitacao.getFullYear() > 1000
        ? 'Data da solicitação: ' +
          solicitacao.dataSolicitacao.toLocaleString('pt-BR')
        : '',
    ];

    this.enviarEmailCadastro(usuario.email, valores);
    this.enviarSMSCadastro(usuario.telefone);
  }

  async atualizar(
    usuario: DadosUsuarioLogado,
    atualizarOrcamentoDto: AtualizarOrcamentoDto,
  ) {
    const orcamento = await this.validarDadosAtualizar(
      usuario,
      atualizarOrcamentoDto,
    );

    await this.prisma.orcamento.update({
      data: {
        ...orcamento,
        dataEntrega: atualizarOrcamentoDto?.dataEntrega || undefined,
        maoObra: atualizarOrcamentoDto?.maoObra || undefined,
        material: atualizarOrcamentoDto?.material || undefined,
        observacao: atualizarOrcamentoDto?.observacao || undefined,
        usuarioId: atualizarOrcamentoDto?.usuarioId || undefined,
        diarioObra: atualizarOrcamentoDto?.diarioObra || undefined,
      },
      where: { id: atualizarOrcamentoDto.id },
    });
  }

  async confirmar(confirmarOrcamentoDto: ConfirmarOrcamentoDto) {
    await this.validarDadosConfirmar(confirmarOrcamentoDto)

    // TODO: Adicionar pagamento
    const transacao = {id: 1}

    const orcamento = await this.prisma.orcamento.update({
      include: {
        taxasExtras: true,
      },
      data: {
        transacaoId: transacao.id
      },
      where: {
        id: confirmarOrcamentoDto.id
      }
    })

    return orcamento
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

  private async validarDadosCadastrar(
    usuario: DadosUsuarioLogado,
    cadastrarOrcamentoDto: CadastrarOrcamentoDto,
  ) {
    if (usuario.perfilId != PerfilEnum.FORNECEDOR)
      throw new BadRequestException('O usuário não tem perfil de colaborador');

    const solicitacao = await this.prisma.solicitacao.findUnique({
      where: {
        id: cadastrarOrcamentoDto.solicitacaoId,
      },
    });

    if (!solicitacao) throw new BadRequestException('Solicitação inválida');

    const totalOrcamentos = await this.prisma.orcamento.count({
      where: {
        solicitacaoId: cadastrarOrcamentoDto.solicitacaoId,
      },
    });

    const totalMaximoOrcamentos = (await this.prisma.configuracao.findFirst())
      .maximoOrcamentos;

    if (totalOrcamentos >= totalMaximoOrcamentos)
      throw new BadRequestException(
        'O número máximo de orçamentos para esta solicitação foi atingido',
      );

    const visita = this.prisma.visita.findFirst({
      where: {
        solicitacaoId: cadastrarOrcamentoDto.solicitacaoId,
      },
    });

    if (!visita)
      throw new BadRequestException(
        'A solicitação não possui visita cadastrada',
      );

    return solicitacao;
  }

  private async enviarEmailCadastro(destinatário: string, valores: string[]) {
    const assunto = 'FixIt - Orçamento criado';
    let mensagem = `<div style="background-color: #DFDFDF; padding: 10px; min-height: 400px;"><div style="max-width: 800px; background-color: #ffffff; border: solid 1px #707070; border-radius: 3px; margin: 3em auto; padding: 0px;"><div style="text-align:center;"><img style="padding-top: 25px" src="http://fixit-togo.com.br/images/logo.png"></img><br/><div style="background-color: #3E3E3E; text-align: center;"><h1 style="font-family: sans-serif; font-size: 2em; color: #ffffff; padding: 0.5em">${assunto.substring(8)}</h1></div><div style="padding: 3em; ">Olá, <br/><br/>Geramos um orçamento,<br/>acesse o aplicativo do FixIt para visualizá-lo.<br/>`;

    for (let valor in valores) {
      mensagem += `<br/>${valor}<br/>`;
    }

    mensagem += `<br/>Abraços da equipe FixIt.<br/></div></div></div><div style=\"color: #787878; text-align: center;\"><p>Não responda este e-mail, e-mail automático.</p><p>Aplicativo disponível na <a href=\"https://play.google.com/store/apps/details?id=br.com.prolins.fixitToGo\">Google Play</a> e na <a href=\"https://itunes.apple.com/br/app/fixit/id1373851231?mt=8\">App Store</a></p><p>Em caso de qualquer dúvida, fique à vontade<br/>para enviar um e-mail para <a href=\"mailto:fixit@fixit-togo.com.br\">fixit@fixit-togo.com.br</a></p></div>`;

    this.mailService.enviarEmailHtml(destinatário, assunto, mensagem);
  }

  private async enviarSMSCadastro(telefone: string) {
    await this.smsService.enviarSMS(
      telefone,
      'Fixit: Geramos um orcamento, acesse o aplicativo para visualizar.',
    );
  }

  private async validarDadosAtualizar(
    usuario: DadosUsuarioLogado,
    atualizarOrcamentoDto: AtualizarOrcamentoDto,
  ) {
    const orcamento = await this.prisma.orcamento.findUnique({
      where: {
        id: atualizarOrcamentoDto.id,
      },
    });

    if (!orcamento)
      throw new ForbiddenException('Orçamento inválido para este id');

    if (orcamento.pago)
      throw new ForbiddenException(
        'Esta ação não pode ser feita, pois uma operação financeira já foi realizada',
      );

    if (usuario != null && usuario.perfilId == PerfilEnum.CLIENTE)
      throw new ForbiddenException('Usuário sem autorização');

    return orcamento;
  }

  private async validarDadosConfirmar(
    confirmarOrcamentoDto: ConfirmarOrcamentoDto,
  ) {
    const orcamento = await this.prisma.orcamento.findUnique({
      where: {
        id: confirmarOrcamentoDto.id,
      },
    });

    if (!orcamento)
      throw new BadRequestException('Orçamento não encontrado');

    if (confirmarOrcamentoDto.metodoPagamento == MetodoPagamentoEnum.BOLETO) {
      if (Decimal.sum(orcamento.maoObra, orcamento.material) < new Decimal(5.0))
        throw new BadRequestException(
          'Pagamento via boleto possuem valor mínimo de R$ 5.00',
        );

      return;
    } else {
      throw new NotImplementedException('Não implementado');
    }
  }
}
