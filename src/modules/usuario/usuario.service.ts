import { Injectable } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';
import { DadosUsuarioLogado } from 'src/shared/entities/dados-usuario-logado.entity';

@Injectable()
export class UsuarioService {
  constructor(private readonly prisma: PrismaService) {}

  listarDados(usuario: DadosUsuarioLogado) {
    return this.prisma.usuario.findFirst({
      where: {
        Id: usuario.Id,
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} usuario`;
  }

  update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    return `This action updates a #${id} usuario`;
  }

  remove(id: number) {
    return `This action removes a #${id} usuario`;
  }
}
