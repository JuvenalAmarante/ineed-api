import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CobrancaEfiPay } from './entities/cobranca-efi-pay.entity';
import { GerarCobrancaEfiPay } from './dto/gerar-cobranca-efi-pay.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AxiosResponse } from 'axios';

@Injectable()
export class EfiPayService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async login(): Promise<{
    access_token: string;
    refresh_token: string;
  } | null> {
    const credenciais = {
      client_id: this.configService.get('EFI_PAY_ID'),
      client_secret: this.configService.get('EFI_PAY_KEY'),
    };

    const data_credentials = `${credenciais.client_id}:${credenciais.client_secret}`;

    const auth = Buffer.from(data_credentials).toString('base64');

    return new Promise((resolve, reject) => {
      this.httpService
        .post(
          '/v1/authorize',
          { grant_type: 'client_credentials' },
          {
            headers: {
              Authorization: `Basic ${auth}`,
            },
          },
        )
        .subscribe({
          next: (res) => {
            console.log('EFI PAY Autenticado');
            resolve({
              access_token: res.data.access_token,
              refresh_token: res.data.refresh_token,
            });
          },
          error: (res) => {
            console.error(
              `Ocorreu um erro ao autenticar a EFI PAY: ${res.response.status}`,
              res.response.data,
            );

            reject(null);
          },
        });
    });
  }

  async gerarCobranca(
    gerarCobrancaDto: GerarCobrancaEfiPay,
  ): Promise<CobrancaEfiPay['data']> {
    const credenciais = await this.login();

    if (!credenciais)
      throw new InternalServerErrorException(
        'Ocorreu um erro ao gerar a cobraça',
      );

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: gerarCobrancaDto.usuarioId,
      },
    });

    if (
      !usuario ||
      ![11, 14].includes(usuario.cpfCnpj.replace(/[^\d]+/g, '').length) ||
      !usuario.dataAniversario ||
      !usuario.telefone ||
      !usuario.email
    )
      throw new BadRequestException('Dados de cadastro do usuário inválidos');

    const data = {
      items: [
        {
          name: 'FixIt: Prestação de serviço',
          amount: 1,
          value: gerarCobrancaDto.valor,
        },
      ],
      payment: {
        credit_card: {
          customer: {
            name:
              usuario.cpfCnpj.replace(/[^\d]+/g, '').length == 11
                ? usuario.nome
                : undefined,
            cpf:
              usuario.cpfCnpj.replace(/[^\d]+/g, '').length == 11
                ? usuario.cpfCnpj.replace(/[^\d]+/g, '')
                : undefined,
            email: usuario.email,
            phone_number: usuario.telefone.replace(/[^\d]+/g, ''),
            birth: usuario.dataAniversario.toLocaleDateString('en-CA'),
            juridical_person:
              usuario.cpfCnpj.replace(/[^\d]+/g, '').length == 14
                ? {
                    cnpj: usuario.cpfCnpj.replace(/[^\d]+/g, ''),
                    corporate_name: usuario.nome,
                  }
                : undefined,
          },
          installments: gerarCobrancaDto.parcela,
          payment_token: gerarCobrancaDto.token,
          billing_address: {
            street: usuario.endereco,
            number: usuario.numero,
            neighborhood: usuario.bairro,
            zipcode: usuario.cep,
            city: usuario.cidade,
            complement: usuario.complemento,
            state: usuario.uf,
          },
        },
      },
    };

    return new Promise((resolve, reject) => {
      this.httpService
        .post('/v1/charge/one-step', data, {
          headers: {
            Authorization: `Bearer ${credenciais.access_token}`,
          },
        })
        .subscribe({
          next: (res: AxiosResponse<CobrancaEfiPay, any>) => {
            if (!!res.data.data.refusal)
              reject(
                new BadRequestException(
                  `Ocorreu um erro ao gerar a cobrança: ${res.data.data.refusal.reason}`,
                ),
              );

            console.log(res.data, !!res.data.data.refusal);

            resolve(res.data.data);
          },
          error: (res) => {
            console.error(
              'Ocorreu um erro ao gerar a cobrança',
              res.response.data,
              credenciais.access_token,
            );

            reject(
              new BadRequestException('Ocorreu um erro ao gerar a cobrança'),
            );
          },
        });
    });
  }
}
