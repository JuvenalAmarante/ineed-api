import { S3Service } from './../../shared/services/s3/s3.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { FiltroListarSolicitacaoDto } from './dto/filtro-listar-solicitacao.dto';
import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';
import { PerfilEnum } from 'src/shared/enums/perfil.enum';
import { Prisma } from '@prisma/client';
import { CriarSolicitacaoDto } from './dto/criar-solicitacao.dto';
import { MailService } from 'src/shared/services/mail/mail.service';

@Injectable()
export class SolicitacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly s3Service: S3Service,
  ) {}

  async listar(
    usuario: DadosUsuarioLogado,
    filtroListarSolicitacaoDto: FiltroListarSolicitacaoDto,
  ) {
    if (filtroListarSolicitacaoDto.id) {
      const solicitacao = await this.listarPorId(filtroListarSolicitacaoDto.id);

      return this.listarDados(solicitacao);
    }

    const solicitacoes = await this.listarPorFiltros(
      usuario,
      filtroListarSolicitacaoDto,
    );

    await Promise.all(
      solicitacoes.map(async (solicitacao) => ({
        ...(await this.listarDados(solicitacao)).solicitacao,
      })),
    );

    return solicitacoes;
  }

  async deletar(id: number, usuario: DadosUsuarioLogado) {
    const solicitacao = await this.prisma.solicitacao.findUnique({
      where: {
        id,
      },
    });

    if (!solicitacao) throw new ForbiddenException('Solicitação inválida.');

    if (!solicitacao.ativo)
      throw new ForbiddenException(
        'A ação que você está tentando executar já foi executada',
      );

    if (
      usuario.perfilId == PerfilEnum.CLIENTE &&
      solicitacao.usuarioId != usuario.id
    )
      throw new ForbiddenException('A solicitação não pertence a esse usuário');

    const orcamento = await this.prisma.orcamento.findFirst({
      where: {
        solicitacaoId: solicitacao.id,
      },
    });

    const taxaExtra = await this.prisma.taxaExtra.findFirst({
      where: {
        orcamentoId: orcamento.id,
      },
    });

    if (
      (orcamento != null && orcamento.pago) ||
      (taxaExtra != null && taxaExtra.pago)
    )
      throw new BadRequestException(
        'Esta ação não pode ser feita, pois uma operação financeira já foi realizada.',
      );

    return this.prisma.solicitacao.update({
      data: {
        ativo: false,
      },
      where: {
        id,
      },
    });
  }

  async criar(
    usuarioId: number,
    criarSolicitacaoDto: CriarSolicitacaoDto,
    files: Array<Express.Multer.File>,
  ) {
    const solicitacao = await this.prisma.$transaction(async (transaction) => {
      let solicitacao = await transaction.solicitacao.findFirst({
        where: {
          usuarioId,
          dataInicial: criarSolicitacaoDto.dataInicial,
          urgente: criarSolicitacaoDto.urgente,
          dataFinal: criarSolicitacaoDto.dataFinal,
          endereco: criarSolicitacaoDto.endereco,
          observacao: criarSolicitacaoDto.observacao,
          material: criarSolicitacaoDto.material,
          iMovelId: criarSolicitacaoDto.imovelId,
        },
      });

      if (solicitacao)
        throw new BadRequestException('Solicitação já cadastrada');

      solicitacao = await transaction.solicitacao.create({
        data: {
          dataSolicitacao: new Date(),
          usuarioId,
          dataInicial: criarSolicitacaoDto.dataInicial,
          urgente: criarSolicitacaoDto.urgente,
          dataFinal: criarSolicitacaoDto.dataFinal,
          endereco: criarSolicitacaoDto.endereco,
          observacao: criarSolicitacaoDto.observacao,
          material: criarSolicitacaoDto.material,
          iMovelId: criarSolicitacaoDto.imovelId,
          ativo: true,
          servicoSolicitacao: {
            createMany: {
              data: criarSolicitacaoDto.servicoId.map((servicoId) => ({
                servicoId,
              })),
            },
          },
        },
      });

      for (const file in files) {
        const url = await this.s3Service.upload(files[file]);

        await transaction.imagemSolicitacao.create({
          data: {
            solicitacaoId: solicitacao.id,
            valor: url,
          },
        });
      }

      return solicitacao;
    });

    const valores = [
      solicitacao.urgente ? 'Solicitação de extrema urgência!' : '',
      solicitacao.dataInicial.getFullYear() > 1000
        ? `Data inicial: ${solicitacao.dataInicial.toLocaleDateString('pt-BR')}`
        : '',
      solicitacao.dataSolicitacao.getFullYear() > 1000
        ? `Data da solicitação: ${solicitacao.dataSolicitacao.toLocaleDateString('pt-BR')}`
        : '',
      `Endereço: ${solicitacao.endereco}`,
      solicitacao.observacao != null && solicitacao.observacao != ''
        ? `◊Observação: ${solicitacao.observacao}`
        : '',
    ];

    await this.enviarNotificacao(solicitacao.usuarioId, valores);

    return solicitacao;
  }

  private async listarPorId(id: number) {
    const solicitacao = await this.prisma.solicitacao.findUnique({
      select: {
        id: true,
        dataSolicitacao: true,
        usuarioId: true,
        usuario: true,
        dataInicial: true,
        urgente: true,
        dataFinal: true,
        endereco: true,
        observacao: true,
        material: true,
        iMovelId: true,
        ativo: true,
      },
      where: {
        id,
      },
    });

    if (!solicitacao)
      throw new BadRequestException('Não há solicitações para esse usuário');

    return solicitacao;
  }

  private async listarDados(solicitacao: any) {
    const visita = await this.prisma.visita.findMany({
      where: {
        solicitacaoId: solicitacao.id,
      },
    });

    const orcamento = await this.prisma.orcamento.findMany({
      select: {
        id: true,
        usuarioId: true,
        dataEntrega: true,
        dataCriacao: true,
        solicitacaoId: true,
        observacao: true,
        maoObra: true,
        concluido: true,
        pago: true,
        material: true,
        diarioObra: true,
        requisicaoId: true,
        avaliacaoId: true,
        transacaoId: true,
        imagem: true,
        usuarioCollaborador: true,
        requisicao: true,
        avaliacao: true,
        solicitacao: true,
        taxasExtras: true,
        transacao: true,
      },
      where: {
        solicitacaoId: solicitacao.id,
      },
    });

    if (orcamento) {
      const descontoData = await this.prisma.desconto.findFirst({
        where: {
          userId: solicitacao.usuarioId,
          ativado: false,
        },
        orderBy: {
          taxa: 'desc',
        },
      });

      orcamento['desconto'] = {
        ativado: descontoData.ativado,
        cupomId: descontoData.cupomId,
        desconto: descontoData.taxa,
        id: descontoData.id,
      };
    }

    solicitacao['visita'] = visita;

    return {
      solicitacao,
      visita,
      orcamento,
    };
  }

  private async listarPorFiltros(
    usuario: DadosUsuarioLogado,
    filtroListarSolicitacaoDto: FiltroListarSolicitacaoDto,
  ) {
    const include = this.getTabelas(filtroListarSolicitacaoDto);
    const where = this.getFiltros(filtroListarSolicitacaoDto);

    switch (usuario.perfilId) {
      case PerfilEnum.CLIENTE:
        return this.prisma.solicitacao.findMany({
          include,
          where: {
            usuarioId: usuario.id,
            ...where,
          },
          orderBy: {
            dataSolicitacao: 'desc',
          },
        });

      case PerfilEnum.ADMIN:
      case PerfilEnum.COLABORADOR:
      case PerfilEnum.FORNECEDOR:
        return this.prisma.solicitacao.findMany({
          include,
          where,
          orderBy: {
            dataSolicitacao: 'desc',
          },
        });
    }
  }

  private getFiltros(
    filtroListarSolicitacaoDto: FiltroListarSolicitacaoDto,
  ): Prisma.SolicitacaoWhereInput {
    return {
      id: filtroListarSolicitacaoDto.filtrarPor?.includes('id')
        ? +filtroListarSolicitacaoDto.filtroValor.at(
            filtroListarSolicitacaoDto.filtrarPor?.findIndex(
              (value) => value == 'id',
            ),
          )
        : undefined,
      endereco: filtroListarSolicitacaoDto.filtrarPor?.includes('endereco')
        ? filtroListarSolicitacaoDto.filtroValor.at(
            filtroListarSolicitacaoDto.filtrarPor?.findIndex(
              (value) => value == 'endereco',
            ),
          )
        : undefined,
      dataFinal: filtroListarSolicitacaoDto.filtrarPor?.includes('dataFinal')
        ? filtroListarSolicitacaoDto.filtroValor.at(
            filtroListarSolicitacaoDto.filtrarPor?.findIndex(
              (value) => value == 'dataFinal',
            ),
          )
        : undefined,
      servicoSolicitacao:
        filtroListarSolicitacaoDto.filtrarPor?.includes('categoriaId') ||
        filtroListarSolicitacaoDto.filtrarPor?.includes('servicoId')
          ? {
              some: {
                servico: filtroListarSolicitacaoDto.filtrarPor?.includes(
                  'categoriaId',
                )
                  ? {
                      categoriaId: +filtroListarSolicitacaoDto.filtroValor.at(
                        filtroListarSolicitacaoDto.filtrarPor?.findIndex(
                          (value) => value == 'categoriaId',
                        ),
                      ),
                    }
                  : undefined,
                servicoId: filtroListarSolicitacaoDto.filtrarPor?.includes(
                  'servicoId',
                )
                  ? +filtroListarSolicitacaoDto.filtroValor.at(
                      filtroListarSolicitacaoDto.filtrarPor?.findIndex(
                        (value) => value == 'servicoId',
                      ),
                    )
                  : undefined,
              },
            }
          : undefined,
      usuario:
        filtroListarSolicitacaoDto.filtrarPor?.includes('emailCliente') &&
        filtroListarSolicitacaoDto.filtrarPor?.includes('nomeCliente')
          ? {
              nome: filtroListarSolicitacaoDto.filtrarPor?.includes(
                'nomeCliente',
              )
                ? filtroListarSolicitacaoDto.filtroValor.at(
                    filtroListarSolicitacaoDto.filtrarPor?.findIndex(
                      (value) => value == 'nomeCliente',
                    ),
                  )
                : undefined,
              email: filtroListarSolicitacaoDto.filtrarPor?.includes(
                'emailCliente',
              )
                ? filtroListarSolicitacaoDto.filtroValor.at(
                    filtroListarSolicitacaoDto.filtrarPor?.findIndex(
                      (value) => value == 'emailCliente',
                    ),
                  )
                : undefined,
            }
          : undefined,
      ativo:
        (filtroListarSolicitacaoDto.filtrarPor?.includes('exibirCancelados') &&
          ['false', '0'].includes(
            filtroListarSolicitacaoDto.filtroValor.at(
              filtroListarSolicitacaoDto.filtrarPor?.findIndex(
                (value) => value == 'exibirCancelados',
              ),
            ),
          )) ||
        (filtroListarSolicitacaoDto.filtrarPor?.includes('ativo') &&
          ['true', '1'].includes(
            filtroListarSolicitacaoDto.filtroValor.at(
              filtroListarSolicitacaoDto.filtrarPor?.findIndex(
                (value) => value == 'ativo',
              ),
            ),
          )) ||
        undefined,

      orcamentos: {
        every:
          filtroListarSolicitacaoDto.filtrarPor?.includes('exibirConcluidos') &&
          ['false', '0'].includes(
            filtroListarSolicitacaoDto.filtroValor.at(
              filtroListarSolicitacaoDto.filtrarPor?.findIndex(
                (value) => value == 'exibirConcluidos',
              ),
            ),
          )
            ? {
                OR: [
                  {
                    concluido: false,
                  },
                  {
                    avaliacaoId: null,
                  },
                ],
              }
            : undefined,
        some: {
          OR: [
            filtroListarSolicitacaoDto.filtrarPor?.includes('status') &&
            +filtroListarSolicitacaoDto.filtroValor.at(
              filtroListarSolicitacaoDto.filtrarPor?.findIndex(
                (value) => value == 'status',
              ),
            ) == 3
              ? {
                  pago: false,
                  taxasExtras: {
                    some: {},
                  },
                }
              : null,
            filtroListarSolicitacaoDto.filtrarPor?.includes('status') &&
            +filtroListarSolicitacaoDto.filtroValor.at(
              filtroListarSolicitacaoDto.filtrarPor?.findIndex(
                (value) => value == 'status',
              ),
            ) == 4
              ? {
                  pago: true,
                  concluido: false,
                }
              : null,
            filtroListarSolicitacaoDto.filtrarPor?.includes('status') &&
            +filtroListarSolicitacaoDto.filtroValor.at(
              filtroListarSolicitacaoDto.filtrarPor?.findIndex(
                (value) => value == 'status',
              ),
            ) == 5
              ? {
                  pago: true,
                  concluido: true,
                  avaliacaoId: null,
                }
              : null,

            filtroListarSolicitacaoDto.filtrarPor?.includes('status') &&
            +filtroListarSolicitacaoDto.filtroValor.at(
              filtroListarSolicitacaoDto.filtrarPor?.findIndex(
                (value) => value == 'status',
              ),
            ) == 6
              ? {
                  pago: true,
                  concluido: true,
                  avaliacaoId: {
                    not: null,
                  },
                }
              : null,
          ].filter((value) => !!value),
        },
      },
      visitas:
        filtroListarSolicitacaoDto.filtrarPor?.includes('status') &&
        +filtroListarSolicitacaoDto.filtroValor.at(
          filtroListarSolicitacaoDto.filtrarPor?.findIndex(
            (value) => value == 'status',
          ),
        ) == 2
          ? {
              some: {
                pago: false,
              },
            }
          : undefined,
    };
  }

  private getTabelas(filtroListarSolicitacaoDto: FiltroListarSolicitacaoDto) {
    return filtroListarSolicitacaoDto?.filtrarPor?.includes('status')
      ? {
          orcamentos: [3, 4, 5, 6].includes(
            +filtroListarSolicitacaoDto.filtroValor.at(
              filtroListarSolicitacaoDto.filtrarPor?.findIndex(
                (value) => value == 'status',
              ),
            ),
          ),
          visitas: [1, 2].includes(
            +filtroListarSolicitacaoDto.filtroValor.at(
              filtroListarSolicitacaoDto.filtrarPor?.findIndex(
                (value) => value == 'status',
              ),
            ),
          ),
        }
      : undefined;
  }

  private async enviarNotificacao(usuarioId: number, valores: string[] = []) {
    const destinatario = await this.prisma.usuario.findUnique({
      include: {
        acesso: true,
      },
      where: {
        id: usuarioId,
      },
    });

    await this.enviarEmail(destinatario.email, valores);
  }

  private async enviarEmail(email: string, valores: string[] = []) {
    const assunto = 'FixIt - Nova solicitação';
    let mensagem = `<div style="background-color: #DFDFDF; padding: 10px; min-height: 400px;"><div style="max-width: 800px; background-color: #ffffff; border: solid 1px #707070; border-radius: 3px; margin: 3em auto; padding: 0px;"><div style="text-align:center;"><img style="padding-top: 25px" src="http://fixit-togo.com.br/images/logo.png"></img><br/><div style="background-color: #3E3E3E; text-align: center;"><h1 style="font-family: sans-serif; font-size: 2em; color: #ffffff; padding: 0.5em">${assunto.substring(8)}</h1></div><div style="padding: 3em; ">Olá, <br/><br/>Uma nova solicitação foi criada,<br/>acesse o aplicativo do FixIt para visualizá-la.<br/>`;

    for (const valor in valores) {
      mensagem += `<br/>${valor}<br/>`;
    }

    mensagem += `<br/>Abraços da equipe FixIt.<br/></div></div></div><div style=\"color: #787878; text-align: center;\"><p>Não responda este e-mail, e-mail automático.</p><p>Aplicativo disponível na <a href=\"https://play.google.com/store/apps/details?id=br.com.prolins.fixitToGo\">Google Play</a> e na <a href=\"https://itunes.apple.com/br/app/fixit/id1373851231?mt=8\">App Store</a></p><p>Em caso de qualquer dúvida, fique à vontade<br/>para enviar um e-mail para <a href=\"mailto:fixit@fixit-togo.com.br\">fixit@fixit-togo.com.br</a></p></div>`;

    await this.mailService.enviarEmailHtml(email, assunto, mensagem);
  }
}
