import { FinalizarOrcamentoDto } from './dto/finalizar-orcamento.dto';
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
import { SmsService } from 'src/shared/services/sms/sms.service';
import { AtualizarOrcamentoDto } from './dto/atualizar-orcamento.dto';
import { MetodoPagamentoEnum } from 'src/shared/enums/metodo-pagamento.enum';
import { PushNotificationService } from 'src/shared/services/push-notification/push-notification.service';
import { TipoNotificacao } from './enums/tipo-notificacao.enum';

@Injectable()
export class OrcamentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
    private readonly pushNotificationService: PushNotificationService,
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
    const { solicitacao, visita } = await this.validarDadosCadastrar(
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
      orcamento.maoObra > new Prisma.Decimal(0)
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

    const data = {
      visitaId: visita.id,
      solicitacaoId: solicitacao.id,
      estimateId: orcamento.id,
      hasMaterial: solicitacao.material,
    };

    this.enviarNotificacao(
      cadastrarOrcamentoDto.usuarioId,
      valores,
      data,
      TipoNotificacao.CADASTRO,
    );
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
    await this.validarDadosConfirmar(confirmarOrcamentoDto);

    // TODO: Adicionar pagamento
    const transacao = { id: 1 };

    const orcamento = await this.prisma.orcamento.update({
      include: {
        taxasExtras: true,
      },
      data: {
        transacaoId: transacao.id,
      },
      where: {
        id: confirmarOrcamentoDto.id,
      },
    });

    return orcamento;
  }

  async finalizar(
    id: number,
    usuarioId: number,
    finalizarOrcamentoDto: FinalizarOrcamentoDto,
  ) {
    if (isNaN(id)) throw new BadRequestException('Orçamento inválido');

    let requisicao;
    let orcamento = await this.prisma.orcamento.findUnique({
      include: {
        taxasExtras: true,
      },
      where: {
        id,
      },
    });

    if (finalizarOrcamentoDto.pago && !finalizarOrcamentoDto.concluida) {
      let valor = Prisma.Decimal.mul(
        Prisma.Decimal.sum(orcamento.maoObra, orcamento.material),
        100,
      );

      const desconto = await this.prisma.desconto.findFirst({
        where: {
          userId: usuarioId,
        },
        orderBy: {
          taxa: 'desc',
        },
      });

      if (desconto) {
        await this.prisma.desconto.update({
          data: {
            ativado: true,
          },
          where: {
            id: desconto.id,
          },
        });

        valor = Prisma.Decimal.sum(valor, desconto.taxa * 100);
      }

      // TODO: Buscar cartao cadastrado
      const cartao = { id: finalizarOrcamentoDto.cartaoId };

      // TODO: Realizar processamento da venda
      // const processamento = processarPagamento(usaurio, cartao, valor)
      console.log(usuarioId, cartao, valor);

      // TODO: Salva requisição de venda
      requisicao = { id: 1 };
    }

    const solicitacao = await this.prisma.solicitacao.findFirst({
      where: {
        id,
      },
    });

    if (!solicitacao)
      throw new BadRequestException('Solicitação não encontrada');

    const visita = await this.prisma.visita.findFirst({
      where: {
        solicitacaoId: solicitacao.id,
      },
    });

    if (requisicao) {
      orcamento = await this.prisma.orcamento.update({
        include: {
          taxasExtras: true,
        },
        data: {
          requisicaoId: requisicao.id,
        },
        where: {
          id,
        },
      });
    } else {
      orcamento = await this.prisma.orcamento.update({
        include: {
          taxasExtras: true,
        },
        data: {
          concluido: orcamento.concluido || finalizarOrcamentoDto.concluida,
          diarioObra: finalizarOrcamentoDto.diarioObra || undefined,
        },
        where: {
          id,
        },
      });
    }

    const valores = [
      '',
      'Endereço: ' + solicitacao.endereco,
      solicitacao.dataInicial.getFullYear() > 1000
        ? 'Data inicial: ' + solicitacao.dataInicial.toLocaleString('pt-BR')
        : '',
      solicitacao.dataSolicitacao.getFullYear() > 1000
        ? 'Data da solicitação: ' +
          solicitacao.dataSolicitacao.toLocaleString('pt-BR')
        : '',
    ];

    const data = {
      visitaId: visita.id,
      solicitacaoId: solicitacao.id,
      estimateId: orcamento.id,
      hasMaterial: solicitacao.material,
    };

    await this.enviarNotificacao(
      orcamento.usuarioId,
      valores,
      data,
      TipoNotificacao.PAGAMENTO,
    );

    return orcamento;
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

    const visita = await this.prisma.visita.findFirst({
      where: {
        solicitacaoId: cadastrarOrcamentoDto.solicitacaoId,
      },
    });

    if (!visita)
      throw new BadRequestException(
        'A solicitação não possui visita cadastrada',
      );

    return { solicitacao, visita };
  }

  private async enviarNotificacao(
    usuarioId: number,
    valores: string[] = [],
    data: Record<string, any> = {},
    tipo: TipoNotificacao,
  ) {
    const destinatario = await this.prisma.usuario.findUnique({
      include: {
        acesso: true,
      },
      where: {
        id: usuarioId,
      },
    });

    this.enviarSMS(destinatario.telefone, tipo);
    this.enviarEmail(destinatario.email, valores, tipo);
    this.enviarNotificacaoPush(
      destinatario.acesso.map((acesso) => acesso.FcmToken),
      data,
      tipo,
    );
  }

  private async enviarEmail(
    email: string,
    valores: string[] = [],
    tipo: TipoNotificacao,
  ) {
    let assunto = '';
    let mensagem = `<div style="background-color: #DFDFDF; padding: 10px; min-height: 400px;"><div style="max-width: 800px; background-color: #ffffff; border: solid 1px #707070; border-radius: 3px; margin: 3em auto; padding: 0px;"><div style="text-align:center;"><img style="padding-top: 25px" src="http://fixit-togo.com.br/images/logo.png"></img><br/>`;

    switch (tipo) {
      case TipoNotificacao.CADASTRO:
        assunto = 'FixIt - Orçamento criado';
        mensagem += `<div style="background-color: #3E3E3E; text-align: center;"><h1 style="font-family: sans-serif; font-size: 2em; color: #ffffff; padding: 0.5em">${assunto.substring(8)}</h1></div><div style="padding: 3em; ">Olá, <br/><br/>Geramos um orçamento,<br/>acesse o aplicativo do FixIt para visualizá-lo.<br/>`;
        break;
      case TipoNotificacao.PAGAMENTO:
        assunto = `FixIt - Orçamento confirmado`;
        mensagem += `<div style=\"background-color: #3E3E3E; text-align: center;\"><h1 style=\"font-family: sans-serif; font-size: 2em; color: #ffffff; padding: 0.5em\">" + assunto.Substring(8) + "</h1></div><div style=\"padding: 3em; \">Olá, <br/><br/>O cliente confirmou o seu orçamento,<br />acesse o aplicativo do FixIt para ver mais informações.<br/>`;
        break;
    }

    for (const valor in valores) {
      mensagem += `<br/>${valor}<br/>`;
    }

    mensagem += `<br/>Abraços da equipe FixIt.<br/></div></div></div><div style=\"color: #787878; text-align: center;\"><p>Não responda este e-mail, e-mail automático.</p><p>Aplicativo disponível na <a href=\"https://play.google.com/store/apps/details?id=br.com.prolins.fixitToGo\">Google Play</a> e na <a href=\"https://itunes.apple.com/br/app/fixit/id1373851231?mt=8\">App Store</a></p><p>Em caso de qualquer dúvida, fique à vontade<br/>para enviar um e-mail para <a href=\"mailto:fixit@fixit-togo.com.br\">fixit@fixit-togo.com.br</a></p></div>`;

    this.mailService.enviarEmailHtml(email, assunto, mensagem);
  }

  private async enviarSMS(telefone: string, tipo: TipoNotificacao) {
    let mensagem;
    switch (tipo) {
      case TipoNotificacao.CADASTRO:
        mensagem =
          'Fixit: Geramos um orcamento, acesse o aplicativo para visualizar.';
        break;
    }

    if (mensagem) await this.smsService.enviarSMS(telefone, mensagem);

    return;
  }

  private async enviarNotificacaoPush(
    tokens: string[],
    data: Record<string, any>,
    tipo: TipoNotificacao,
  ) {
    let titulo = '';
    let mensagem = ``;

    switch (tipo) {
      case TipoNotificacao.CADASTRO:
        titulo = 'Novo orçamento';
        mensagem += `Um novo orçamento foi criado. Deseja ver agora?`;
        break;
      case TipoNotificacao.PAGAMENTO:
        titulo = `Orçamento pago`;
        mensagem += `Seu orçamento foi pago. Deseja ver agora?`;
        break;
    }

    await this.pushNotificationService.enviarNotificacaoPush(
      tokens,
      titulo,
      mensagem,
      data,
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

    if (!orcamento) throw new BadRequestException('Orçamento não encontrado');

    if (confirmarOrcamentoDto.metodoPagamento == MetodoPagamentoEnum.BOLETO) {
      if (
        Prisma.Decimal.sum(orcamento.maoObra, orcamento.material) <
        new Prisma.Decimal(5.0)
      )
        throw new BadRequestException(
          'Pagamento via boleto possuem valor mínimo de R$ 5.00',
        );

      return;
    } else {
      throw new NotImplementedException('Não implementado');
    }
  }
}
