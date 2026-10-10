/**
 * Helpers de formatação de texto enquanto o usuário digita.
 * Não é algo pedido explicitamente — adicionei para o formulário de
 * Pacientes ficar mais parecido com o protótipo (CPF/telefone/data
 * já formatados). Se preferir inputs sem máscara, é só não usar
 * essas funções nos onChangeText dos campos.
 */

export function formatarCpf(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  return digitos
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 10) {
    return digitos
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digitos
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

export function formatarDataDigitada(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 8);
  return digitos
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2');
}

// Mascara o CPF para exibição em listagens (ex: ***.456.789-00)
export function mascararCpf(cpf: string): string {
  if (!cpf || cpf.length < 4) return cpf;
  return `***.${cpf.slice(4)}`;
}
