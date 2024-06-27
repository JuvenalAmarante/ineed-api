import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @IsEmail(null,{
    message: 'O email informado é inválido.'
  })
  @IsNotEmpty({
    message: 'O campo email é obrigatório.'
  })
  Email: string;

  @IsString({
    message: 'A senha informada é inválida.'
  })
  @IsNotEmpty({
    message: 'O campo senha é obrigatório.'
  })
  Senha:string;
}
