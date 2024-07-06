import { Test, TestingModule } from '@nestjs/testing';
import { CupomService } from './cupom.service';

describe('CupomService', () => {
  let service: CupomService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CupomService],
    }).compile();

    service = module.get<CupomService>(CupomService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
