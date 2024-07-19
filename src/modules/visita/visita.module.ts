import { Module } from '@nestjs/common';
import { VisitaService } from './visita.service';
import { VisitaController } from './visita.controller';

@Module({
  controllers: [VisitaController],
  providers: [VisitaService],
})
export class VisitaModule {}
