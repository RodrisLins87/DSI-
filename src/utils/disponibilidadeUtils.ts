export interface IntervaloDisponibilidade {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
}

export const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];


// Converte "08:30" em minutos (510) para facilitar comparações
export function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

// Verifica se dois intervalos no mesmo dia se sobrepõem (RN06)
export function temSobreposicao(
  i1: IntervaloDisponibilidade,
  i2: IntervaloDisponibilidade
): boolean {
  if (i1.diaSemana !== i2.diaSemana) return false;
  const inicio1 = horaParaMinutos(i1.horaInicio);
  const fim1 = horaParaMinutos(i1.horaFim);
  const inicio2 = horaParaMinutos(i2.horaInicio);
  const fim2 = horaParaMinutos(i2.horaFim);

  return inicio1 < fim2 && fim1 > inicio2;
}