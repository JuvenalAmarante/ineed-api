import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CadastrarUsuarioDto {
  @IsString({
    message: 'O nome informado é inválido.',
  })
  @IsNotEmpty({
    message: 'O campo nome é obrigatório.',
  })
  Nome: string;

  @IsEmail(
    {},
    {
      message: 'O email informado é inválido.',
    },
  )
  @IsNotEmpty({
    message: 'O campo email é obrigatório.',
  })
  Email: string;

  @IsString({
    message: 'A senha informada é inválida.',
  })
  @IsNotEmpty({
    message: 'O campo senha é obrigatório.',
  })
  Senha: string;

  @IsString({ message: 'O campo RG é inválido.' })
  @IsOptional()
  Rg?: string;

  @IsString({ message: 'O campo CPF/CNPJ é inválido.' })
  @MinLength(14, { message: 'O campo CPF/CNPJ é inválido.' })
  @MaxLength(16, { message: 'O campo CPF/CNPJ é inválido.' })
  @IsOptional()
  CpfCnpj?: string;

  @IsNotEmpty({
    message: 'O campo perfil é obrigatório.',
  })
  @IsInt({
    message: 'O campo perfil é inválido.',
  })
  @Type(() => Number)
  PerfilId: number;

  @IsNotEmpty({
    message: 'O campo tipo é obrigatório.',
  })
  @IsInt({
    message: 'O campo tipo é inválido.',
  })
  @Type(() => Number)
  TipoId: number;

  @IsString({
    message: 'O campo endereço é inválido.',
  })
  @IsOptional()
  Endereco?: string;

  @IsInt({
    message: 'O campo tipo número é inválido.',
  })
  @Type(() => Number)
  @IsOptional()
  Numero?: number;

  @IsString({
    message: 'O campo endereço é inválido.',
  })
  @IsOptional()
  Cep?: string;

  @IsString({
    message: 'O campo endereço é inválido.',
  })
  @IsOptional()
  Telefone?: string;

  @IsString({
    message: 'O campo endereço é inválido.',
  })
  @IsOptional()
  Cidade?: string;

  @IsString({
    message: 'O campo endereço é inválido.',
  })
  @IsOptional()
  ImagemUrl?: string;

  @IsString({
    message: 'O campo endereço é inválido.',
  })
  @IsOptional()
  Uf?: string;

  @IsString({
    message: 'O campo complemento é inválido.',
  })
  @IsOptional()
  Complemento?: string;

  @IsDate({
    message: 'O campo data de aniversário é inválido',
  })
  @Type(() => Date)
  @IsOptional()
  DataAniversario?: Date;

  @IsBoolean({
    message: 'O campo conta rede social é inválido',
  })
  @IsOptional()
  ContaRedeSocial?: boolean;

  @IsInt({
    message: 'O campo tipo rede social é inválido.',
  })
  @Type(() => Number)
  @IsOptional()
  IdTipoRedeSocial?: number;

  @IsString({
    message: 'O campo rede social é inválido.',
  })
  @IsOptional()
  IdRedeSocial?: string;

  @IsInt({
    message: 'O campo cupom é inválido.',
  })
  @Type(() => Number)
  @IsOptional()
  CupomId?: number;
}
