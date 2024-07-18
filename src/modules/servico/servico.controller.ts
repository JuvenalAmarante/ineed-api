import { Controller, Get, Query } from '@nestjs/common';
import { ServicoService } from './servico.service';

@Controller('servico')
export class ServicoController {
  constructor(private readonly servicoService: ServicoService) {}

  @Get()
  async listar(@Query('id') categoriaId: string) {
    return {
      servico: await this.servicoService.listar(+categoriaId),
    };
  }
}
