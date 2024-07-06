import { Test, TestingModule } from '@nestjs/testing';
import { CupomController } from './cupom.controller';
import { CupomService } from './cupom.service';

describe('CupomController', () => {
  let controller: CupomController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CupomController],
      providers: [CupomService],
    }).compile();

    controller = module.get<CupomController>(CupomController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
