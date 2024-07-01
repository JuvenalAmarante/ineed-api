import { LoginDto } from './dto/login.dto';
import { PrismaService } from '../../shared/services/prisma/prisma.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { encriptar } from 'src/shared/helpers/encrypt.helper';
import { gerarToken } from 'src/shared/helpers/token.helper';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(loginDto: LoginDto, device: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        Email: loginDto.Email,
        Senha: encriptar(loginDto.Senha),
      },
    });

    if (!usuario) throw new BadRequestException('Usuário ou senha incorretos');

    const token = gerarToken();

    await this.prisma.acesso.create({
      data: {
        UsuarioId: usuario.Id,
        Token: token,
        Device: device,
      },
    });

    if (usuario)
      return {
        acept: ' Acesso permitido',
        device: device,
        perfilId: usuario.PerfilId,
        usuarioId: usuario.Id,
        token,
      };

    return;
  }

  async logout(token: string) {
    await this.prisma.acesso.deleteMany({
      where: {
        Token: token,
      },
    });

    return;
  }
}
