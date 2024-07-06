import { Controller } from '@nestjs/common';
import { DescontoService } from './desconto.service';

@Controller('desconto')
export class DescontoController {
  constructor(private readonly descontoService: DescontoService) {}
}
