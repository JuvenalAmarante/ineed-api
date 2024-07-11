import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { BooleanTransformHelper } from 'src/shared/helpers/boolean.helper';

export class FinalizarOrcamentoDto {
  @IsBoolean({
    message: 'O campo concluido é inválido',
  })
  @IsOptional()
  @Transform(BooleanTransformHelper)
  concluida?: boolean;

  @IsBoolean({
    message: 'O campo pago é inválido',
  })
  @IsOptional()
  @Transform(BooleanTransformHelper)
  pago?: boolean;

  @IsString({
    message: 'O campo diario da obra é inválido',
  })
  @IsOptional()
  diarioObra?: string;

  @IsInt({
    message: 'O campo cartão é inválido',
  })
  @IsOptional()
  @Type(() => Number)
  cartaoId?: number;
}
