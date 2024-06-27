import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../services/prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;

    if (!token) throw new UnauthorizedException('Token inválido');

    try {
      const acesso = await this.prisma.acesso.findFirst({
        where: {
          Token: token,
        },
      });
      
      if (!acesso) throw new UnauthorizedException('Token inválido');

      request['usuario'] = { Id: acesso.UsuarioId };
    } catch {
      throw new UnauthorizedException('Token inválido');
    }

    return true;
  }
}
