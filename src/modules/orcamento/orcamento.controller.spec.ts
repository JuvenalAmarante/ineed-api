import { Test, TestingModule } from '@nestjs/testing';
import { OrcamentoController } from './orcamento.controller';
import { OrcamentoService } from './orcamento.service';

describe('OrcamentoController', () => {
  let controller: OrcamentoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrcamentoController],
      providers: [OrcamentoService],
    }).compile();

    controller = module.get<OrcamentoController>(OrcamentoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
