import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';
import { CriarTaxaExtra } from './dto/criar-taxa-extra.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { PushNotificationService } from 'src/shared/services/push-notification/push-notification.service';
import { PerfilEnum } from 'src/shared/enums/perfil.enum';

@Injectable()
export class TaxaExtraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  async criar(usuario: DadosUsuarioLogado, criarTaxaExtra: CriarTaxaExtra) {
    const orcamento = await this.prisma.orcamento.findUnique({
      where: {
        id: criarTaxaExtra.orcamentoId,
      },
    });

    if (!orcamento) throw new BadRequestException('Orçamento não encontrado');

    const solicitacao = await this.prisma.solicitacao.findUnique({
      where: {
        id: orcamento.solicitacaoId,
      },
    });

    if (usuario.perfilId != PerfilEnum.FORNECEDOR) {
      throw new BadRequestException(
        'Você não é um fornecedor para inserir uma taxa extra.',
      );
    }

    if (orcamento.concluido) {
      throw new BadRequestException(
        'Não podemos adicionar uma taxa extra em um orçamento concluído.',
      );
    }

    if (criarTaxaExtra.valor <= 0) {
      throw new BadRequestException('A taxa não pode ser nula ou negativa.');
    }

    const configuracao = await this.prisma.configuracao.findFirst();

    const qtdTaxas = await this.prisma.taxaExtra.count({
      where: {
        orcamentoId: orcamento.id,
      },
    });

    if (qtdTaxas >= configuracao.maximoOrcamentos) {
      throw new BadRequestException(
        'O Orçamento atingiu o número máximo de taxas extras.',
      );
    }

    const taxaExtra = await this.prisma.taxaExtra.create({
      data: {
        orcamentoId: criarTaxaExtra.orcamentoId,
        valor: criarTaxaExtra.valor,
        pago: false,
      },
    });

    const data = {
      status: 'orcamento-taxa-extra',
      solicitacaoId: orcamento.solicitacaoId,
      valor: taxaExtra.valor.toNumber().toLocaleString('pt-BR'),
    };

    await this.enviarNotificacaoPush(solicitacao.usuarioId, data);
  }

  private async enviarNotificacaoPush(
    usuarioId: number,
    data: Record<string, any>,
  ) {
    const destinatario = await this.prisma.usuario.findUnique({
      include: {
        acesso: true,
      },
      where: {
        id: usuarioId,
      },
    });

    const titulo = 'Nova taxa extra';
    const mensagem = `Sua obra possui uma nova taxa extra de ${data.valor}`;

    await this.pushNotificationService.enviarNotificacaoPush(
      destinatario.acesso.map((acesso) => acesso.FcmToken),
      titulo,
      mensagem,
      data,
    );
  }
}
