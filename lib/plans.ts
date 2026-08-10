export type Plan = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  preco_centavos: number;
  periodo: string;
  destaque: boolean;
  ativo: boolean;
};

export function formatarBRL(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
}

export function periodoMeses(periodo: string): number {
  switch (periodo) {
    case "anual":
      return 12;
    case "semestral":
      return 6;
    case "mensal":
      return 1;
    default:
      return 1;
  }
}

export function periodoLabel(periodo: string): string {
  switch (periodo) {
    case "anual":
      return "por ano";
    case "semestral":
      return "por semestre";
    case "mensal":
      return "por mês";
    default:
      return "";
  }
}
