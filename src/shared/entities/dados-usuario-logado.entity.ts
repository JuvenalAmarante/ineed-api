export class DadosUsuarioLogado {
  id: number;
  token: string;
  perfilId: number;
  cupom: {
    id: number;
    codigo: string;
  } | null;
}
